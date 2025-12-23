"""
utils.py

常用工具函数集合, 包括模型加载, 特征提取, 编码模型拟合和可视化.

Author: TA
Created: 2025-11-10
"""


import re
from pathlib import Path
from collections import defaultdict
from typing import Iterable, Literal, Union, Optional
import gc
import numpy as np
from tqdm import tqdm
from sklearn.model_selection import KFold
from sklearn.linear_model import Ridge, RidgeCV
import torch
from torch import nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from transformers import BatchEncoding, PreTrainedTokenizer
import nibabel as nib


def get_tokenizer_valid_len(tokenizer: PreTrainedTokenizer
                            ) -> tuple[int, tuple[list[int], list[int]]]:
    """
    返回 tokenizer 的最大有效序列长度, 以及cls/eos token id.

    e.g. GPT2 -> max_len = 1024, 有eos token但无cls token
         BERT -> max_len = 512, 有cls和sep token

    Returns
    -------
        valid_len : 最大有效长度 (去掉 cls 和 eos)
        (cls_ids, eos_ids) : 包含cls/eos token id的list (无相应token则为空list)
    """

    max_len = tokenizer.model_max_length

    cls_id = tokenizer.cls_token_id

    eos_id = (
        tokenizer.eos_token_id
        or tokenizer.sep_token_id
        or tokenizer.pad_token_id
    )

    if eos_id is None:
        raise ValueError("No valid EOS/SEP/PAD token found in tokenizer.")

    cls_ids = [cls_id] if cls_id is not None else []
    eos_ids = [eos_id] if eos_id is not None else []

    return max_len - len(cls_ids) - len(eos_ids), (cls_ids, eos_ids)


@torch.inference_mode()
def extract_text_features(tokens: list[list[str]], tokenizer: PreTrainedTokenizer,
                          model: nn.Module, layers: Union[int, Iterable[int]],
                          device: Union[str, int, torch.device], batch_size: int = 1,
                          autocast: bool = False, pooling: Literal['mean', 'last'] = 'last'
                          ) -> dict[int, np.ndarray]:
    """
    使用预训练语言模型提取文本特征.

    Parameters
    ----------
        tokens : 分词后的文本list
        tokenizer : 预训练语言模型的分词器
        model : 预训练语言模型
        layers : 要提取的层索引, 可以是单个整数或整数列表
        device : 设备 (如'cuda', 'cpu')
        batch_size : 批量大小
        autocast : 是否使用混合精度推理 (仅在GPU上有效, 默认False)
        pooling : 池化方法, 'mean'表示平均池化, 'last'表示取最后一个token的特征 (对于GPT2等自回归模型)

    Returns
    -------
        dict : keys是层索引, values是对应层的文本特征数组 (shape: [num_texts, feature_dim])
    """

    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = 'right'

    def collate_fn(batch: list[list[str]]) -> BatchEncoding:
        return tokenizer(batch,
                         is_split_into_words=True, # 输入已经完成分词的list
                         padding='longest', # 按batch中最长序列进行padding
                         truncation=True,
                         return_tensors='pt')
    
    dataloader = DataLoader(tokens, batch_size=batch_size,
                            collate_fn=collate_fn, shuffle=False)
    
    if isinstance(layers, int):
        layers = [layers]
    
    model = model.eval()
    # 提取指定层的特征
    hidden_states = defaultdict(list)

    print('Start extracting text features !!!')
    # 遍历数据集, 提取特征
    # tqdm显示进度条
    for ii, batch in tqdm(enumerate(dataloader), total=len(dataloader)):
        batch = batch.to(device)

        # 使用 autocast 进行混合精度推理 (对于Llama等较大的模型, autocast可以显著节省显存)
        with torch.autocast(device_type='cuda', dtype=torch.bfloat16, enabled=autocast):
            outputs = model(**batch, output_hidden_states=True)
        
        # 利用attention mask计算每个序列last token的索引
        last_token_inds = batch['attention_mask'].sum(1) - 1  # (B,)

        for l in layers:
            layer_state = outputs.hidden_states[l]

            # pooling_state: (B, d)
            if pooling == 'mean':
                mask = batch['attention_mask'].unsqueeze(-1)  # (B, T, 1)
                sum_state = (layer_state * mask).sum(1)
                pooling_state = sum_state / mask.sum(1)  # (B, D)
            elif pooling == 'last':
                # 利用tensor进行索引, 可参考numpy数组的高级索引
                # ref: https://numpy.org/doc/stable/user/basics.indexing.html#advanced-indexing
                pooling_state = layer_state[torch.arange(last_token_inds.shape[0]), last_token_inds]

            hidden_states[l].append(pooling_state.cpu().float().numpy())
            del pooling_state
        
        del outputs, batch, layer_state
        if (ii + 1) % 50 == 0:
            # 释放显存 (可选)
            gc.collect()
            torch.cuda.empty_cache()
    
    # 拼接所有batch的特征
    layer_features = {l: np.concatenate(states, 0) for l, states in hidden_states.items()}
    return layer_features


@torch.inference_mode()
def extract_audio_features(audio_chunks: Union[np.ndarray, torch.Tensor],
                           processor,
                           model: nn.Module,
                           layers: Union[int, Iterable[int]],
                           device: Union[str, int, torch.device],
                           batch_size: int = 1,
                           autocast: bool = False,
                           pooling: Literal['mean', 'last'] = 'mean',
                           sampling_rate: int = 16000
                           ) -> dict[int, np.ndarray]:
    """
    使用预训练音频模型提取音频特征.

    Parameters
    ----------
        audio_chunks : 切分后的音频, shape (N, L)
        processor : 音频模型的processor (如Wav2Vec2Processor)
        model : 预训练音频模型
        layers : 要提取的层索引
        device : 设备 (如'cuda', 'cpu')
        batch_size : 批量大小
        autocast : 是否使用混合精度推理 (仅在GPU上有效, 默认False)
        pooling : 池化方法, 'mean'表示平均池化, 'last'表示取最后一帧
        sampling_rate : 采样率, 默认16000

    Returns
    -------
        dict : keys是层索引, values是对应层的音频特征数组 (shape: [num_chunks, feature_dim])
    """

    if isinstance(audio_chunks, np.ndarray):
        audio_chunks = torch.from_numpy(audio_chunks)

    if audio_chunks.ndim != 2:
        raise ValueError("audio_chunks should be a 2D array with shape (N, L).")

    if isinstance(layers, int):
        layers = [layers]

    model = model.to(device).eval()
    hidden_states = defaultdict(list)
    total_batches = (audio_chunks.shape[0] + batch_size - 1) // batch_size

    print('Start extracting audio features !!!')
    for i in tqdm(range(total_batches), total=total_batches):
        batch = audio_chunks[i * batch_size:(i + 1) * batch_size]
        if batch.dtype != torch.float32:
            batch = batch.float()

        batch_np = batch.detach().cpu().numpy()
        inputs = processor(batch_np,
                           sampling_rate=sampling_rate,
                           return_tensors='pt',
                           padding=True,
                           return_attention_mask=True)
        if hasattr(inputs, "to"):
            inputs = inputs.to(device)
        else:
            inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.autocast(device_type='cuda', dtype=torch.bfloat16, enabled=autocast):
            outputs = model(**inputs, output_hidden_states=True)

        attention_mask = inputs.get('attention_mask') if isinstance(inputs, dict) else None
        output_mask = None
        if attention_mask is not None:
            input_lengths = attention_mask.sum(1)
            if hasattr(model, '_get_feat_extract_output_lengths'):
                output_lengths = model._get_feat_extract_output_lengths(input_lengths)
                max_len = outputs.hidden_states[0].shape[1]
                output_mask = (
                    torch.arange(max_len, device=outputs.hidden_states[0].device)
                    .unsqueeze(0) < output_lengths.unsqueeze(1)
                )
            else:
                output_mask = attention_mask
        if output_mask is not None:
            last_token_inds = output_mask.sum(1) - 1

        for l in layers:
            layer_state = outputs.hidden_states[l]

            if pooling == 'mean':
                if output_mask is None:
                    pooling_state = layer_state.mean(1)
                else:
                    mask = output_mask.unsqueeze(-1)
                    sum_state = (layer_state * mask).sum(1)
                    denom = mask.sum(1).clamp(min=1)
                    pooling_state = sum_state / denom
            elif pooling == 'last':
                if output_mask is None:
                    pooling_state = layer_state[:, -1]
                else:
                    pooling_state = layer_state[torch.arange(last_token_inds.shape[0]), last_token_inds]
            else:
                raise ValueError("pooling should be 'mean' or 'last'.")

            hidden_states[l].append(pooling_state.cpu().float().numpy())
            del pooling_state

        del outputs, inputs, layer_state
        if (i + 1) % 50 == 0:
            gc.collect()
            torch.cuda.empty_cache()

    return {l: np.concatenate(states, 0) for l, states in hidden_states.items()}


def concat_feature(features: np.ndarray, window: int, offset: int = 2) -> np.ndarray:
    """
    构建FIR features -> 血氧动力学延迟

    Parameters
    ----------
        features : 原始特征, shape (T, D)
        window : 窗口大小
        offset : 偏移量 (默认2)

    Returns
    -------
        concatenated_features : 拼接后的特征, shape (T, window, D)
    """

    if features.ndim != 2:
        raise ValueError("features should be a 2D array with shape (T, D).")

    feat_tensor = torch.from_numpy(features)
    padded = F.pad(feat_tensor, (0, 0, window + offset - 1, 0), mode='constant')

    # Unfold the tensor: unfold along the time axis (0), with window size 'window' and stride 1
    # shape: (T + window - 1 - window + 1, window, D)
    unfolded = padded.unfold(0, window, 1).transpose(1, 2).flip(1)
    unfolded = unfolded[:features.shape[0]]

    return unfolded.numpy()


def concat_feature_with_for_loop(stim, delays, circpad=False):
    """
    使用for循环实现的延迟拼接 (较慢)
    ref: https://github.com/subbareddy248/speech-llm-brain/blob/main/Brain_preditictions/util.py#L6
    """
    
    nt, ndim = stim.shape
    dstims = []
    for di, d in enumerate(delays):
        dstim = np.zeros((nt, ndim))
        if d < 0: ## negative delay
            dstim[:d, :] = stim[-d:, :]
            if circpad:
                dstim[d:, :] = stim[:-d, :]
        elif d > 0:
            dstim[d:, :] = stim[:-d, :]
            if circpad:
                dstim[:d, :] = stim[-d:, :]
        else: ## d == 0
            dstim = stim.copy()
        dstims.append(dstim)
    return np.hstack(dstims)


def corr_with_np(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """
    按列计算两个二维array每一列的pearson corr. (向量化实现, 效率更高)

    Parameters
    ----------
        a : shape (n_samples, n_features)
        b : shape (n_samples, n_features)

    Returns
    -------
        corrs : pearson corr, 对于常数列返回nan, shape (n_features,)
    """

    if a.shape != b.shape:
        raise ValueError("Shapes of a and b must be the same.")
    a_norm = a - a.mean(axis=0)
    b_norm = b - b.mean(axis=0)
    std_a, std_b = a.std(0), b.std(0)

    # 计算pearson相关系数, 对于常数列返回nan
    corrs = np.full(a.shape[1], np.nan)
    valid = (std_a != 0) & (std_b != 0)
    corrs[valid] = np.mean(
        a_norm[:, valid] * b_norm[:, valid], 0
        ) / (std_a[valid] * std_b[valid])
    
    return corrs
    

def fit_encoding_cv(X: np.ndarray, y: np.ndarray, cv_splitter: KFold,
                    excluded_start: int = 5, excluded_end: int = 5,
                    alphas: Iterable[float] = [10000., 100000., 1000000.]
                    ) -> tuple[Union[Ridge, RidgeCV], np.ndarray]:
    """
    使用岭回归进行5折交叉验证, 并在测试集上评估性能.

    Parameters
    ----------
        X : 特征矩阵, shape (n_samples, n_features)
        y : 目标变量矩阵, shape (n_samples, n_targets)
        excluded_start : 排除开头的样本数 (默认5)
        excluded_end : 排除结尾的样本数 (默认5)
        cv_splitter : 划分数据集的splitter
        alphas : 岭回归的正则化参数列表 (默认[10000., 100000., 1000000.])

    Returns
    -------
        model : 训练好的岭回归模型
        corrs : 交叉验证测试集的平均corr, shape (n_targets,)
    """

    X, y = X[excluded_start: -excluded_end], y[excluded_start: -excluded_end]
    z_corrs = []

    for i, (train_idx, test_idx) in enumerate(cv_splitter.split(X)):
        X_train, y_train = X[train_idx], y[train_idx]
        X_test, y_test = X[test_idx], y[test_idx]

        # model = Ridge(alpha=1000.)
        model = RidgeCV(alphas=alphas, cv=5)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        corr = corr_with_np(y_pred, y_test)

        # Fisher z-transform: 使样本相关系数更接近正态分布
        # ref: https://en.wikipedia.org/wiki/Fisher_transformation
        z_corr = np.arctanh(corr)
        z_corrs.append(z_corr)
    
    corrs = np.tanh(np.mean(z_corrs, 0))
    
    return model, corrs


def extract_hemi_data_from_files(surf_files: list[Path],
                                 hemi_order: tuple[str] = ('L', 'R'),
                                 is_label: bool = False,
                                 return_list: bool = False
                                 ) -> Union[list[np.ndarray], np.ndarray]:
    """
    提取左右半球的surface数据并拼接成全脑数据.

    Parameters
    ----------
        surf_files : 包含左右半球的surface文件路径 (必须包含且仅包含两个文件)
        hemi_order : 指定拼接顺序, 默认('L', 'R'), 即左半球在前
        is_label : 是否为标签数据, 若是则右半球标签值加上左半球最大标签值, 以确保唯一性 (默认False)
        return_list : 是否返回list格式的左右半球数据 (默认False, 返回ndarray)

    Returns
    -------
        whole_brain_signals : 拼接后的全脑数据, shape (n_vertices,) or list of ndarray
    """

    if len(surf_files) != 2:
        raise ValueError("Expect exactly two surface files (L & R hemisphere)!!")
    
    signals = {}
    pattern = re.compile(r'hemi-(?P<hemi>[LR])')
    
    for file in surf_files:
        assert file.suffix == '.gii'
        match = pattern.search(file.stem)
        if match:
            hemi = match.group('hemi')
            signals[hemi] = nib.load(file).agg_data().astype(np.float32)
        else:
            raise ValueError(f"Not available hemi file: {file.name}")
    
    if is_label:
        # 右半球标签加上左半球的最大标签值, 确保各ROI标签唯一
        left_hemi_max_label = np.unique(signals['L']).max()
        right_hemi_nonzero = signals['R'] != 0
        signals['R'][right_hemi_nonzero] = signals['R'][right_hemi_nonzero] + left_hemi_max_label
    
    whole_brain_signals = [signals[hemi] for hemi in hemi_order]

    if return_list:
        return whole_brain_signals
    else:
        return np.concatenate(whole_brain_signals, 0).T
