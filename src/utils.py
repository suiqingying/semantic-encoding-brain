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

    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token or tokenizer.sep_token
    if tokenizer.pad_token is None:
        raise ValueError("Tokenizer has no pad/eos/sep token for padding.")
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
        device_type = 'cuda' if 'cuda' in str(device) else 'cpu'
        with torch.autocast(device_type=device_type, dtype=torch.bfloat16, enabled=autocast):
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
def extract_audio_features(audio_chunks: torch.Tensor,  # 输入：音频chunks张量 [n_chunks, chunk_len]
                           processor,                    # 音频处理器（如Wav2Vec2Processor）
                           model: torch.nn.Module,       # 音频模型（如Wav2Vec2Model）
                           layers: Union[int, Iterable[int], list[int]],
                           device: Union[str, torch.device],
                           batch_size: int = 32,
                           autocast: bool = False,
                           pooling: Literal['mean', 'last'] = 'mean',
                           sampling_rate: int = 16000) -> dict[int, np.ndarray]:
    """
    使用预训练音频模型提取音频chunks的特征
    
    Parameters
    ----------
        audio_chunks : 音频chunks张量, shape (n_chunks, chunk_len)
        processor : 音频处理器（负责标准化、分词化）
        model : 预训练音频模型
        layers : 要提取的层索引（单个整数或列表）
        device : 计算设备
        batch_size : 批次大小
        autocast : 是否使用混合精度
        pooling : 池化方式 - 'mean'平均池化, 'last'取最后一个时间步
        
    Returns
    -------
        dict : 层索引 -> 特征数组 [n_chunks, feature_dim]
    """
    
    is_whisper = getattr(getattr(model, "config", None), "model_type", "") == "whisper"

    # 1. 定义内部collate函数
    chunk_len = int(audio_chunks.shape[1])

    def collate_audio_fn(batch: list[torch.Tensor]) -> dict:
        """将一批音频chunk转换为模型输入格式"""
        # 转换为numpy数组并确保为float32
        audio_arrays = [chunk.numpy().astype(np.float32) for chunk in batch]
        
        # 使用音频处理器处理
        if is_whisper:
            target_len = int(30 * sampling_rate)
            padded_arrays = []
            for arr in audio_arrays:
                if arr.shape[0] < target_len:
                    pad_width = target_len - arr.shape[0]
                    arr = np.pad(arr, (0, pad_width), mode="constant")
                elif arr.shape[0] > target_len:
                    arr = arr[:target_len]
                padded_arrays.append(arr)
            feature_extractor = getattr(processor, "feature_extractor", processor)
            inputs = feature_extractor(
                padded_arrays,
                sampling_rate=sampling_rate,
                return_tensors="pt",
            )
            tokenizer = getattr(processor, "tokenizer", None)
            if tokenizer and tokenizer.eos_token_id is not None:
                dec_ids = torch.tensor([[tokenizer.eos_token_id]], dtype=torch.long)
                inputs["decoder_input_ids"] = dec_ids.repeat(len(padded_arrays), 1)
        else:
            inputs = processor(
                audio_arrays,
                sampling_rate=sampling_rate,   # Wav2Vec2等模型的标准采样率
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=chunk_len
            )
        return inputs
    
    # 2. 创建DataLoader
    dataloader = DataLoader(
        audio_chunks,                     # 你的audio_chunks张量
        batch_size=batch_size,
        collate_fn=collate_audio_fn,      # 使用内部collate函数
        shuffle=False
    )
    
    # 3. 统一layers参数格式
    if isinstance(layers, int):
        layers = [layers]
    
    # 4. 准备模型和存储结构
    model = model.eval().to(device)
    hidden_states = defaultdict(list)     # 存储各层特征
    
    print('开始提取音频特征...')
    
    def pick_hidden_states(outputs) -> tuple:
        for attr in ("hidden_states", "encoder_hidden_states", "audio_hidden_states"):
            hidden = getattr(outputs, attr, None)
            if hidden is not None:
                return hidden
        audio_out = getattr(outputs, "audio_model_output", None)
        if audio_out is not None and getattr(audio_out, "hidden_states", None) is not None:
            return audio_out.hidden_states
        last_hidden = getattr(outputs, "last_hidden_state", None)
        if last_hidden is not None:
            return (last_hidden,)
        raise ValueError("Model outputs do not contain hidden states.")

    # 5. 逐批次提取特征
    for ii, batch in tqdm(enumerate(dataloader), total=len(dataloader)):
        # 移动数据到设备
        batch = {k: v.to(device) for k, v in batch.items()}
        
        # 混合精度推理
        with torch.autocast(device_type='cuda' if 'cuda' in str(device) else 'cpu', 
                          dtype=torch.bfloat16, enabled=autocast):
            outputs = model(**batch, output_hidden_states=True)
        
        hidden_states_all = pick_hidden_states(outputs)
        # 6. 提取指定层的特征并池化
        for layer_idx in layers:
            # 获取指定层的输出 [batch_size, seq_len, hidden_dim]
            layer_state = hidden_states_all[layer_idx]
            attn_mask = None
            if 'attention_mask' in batch:
                raw_mask = batch['attention_mask']
                if raw_mask.shape[1] == layer_state.shape[1]:
                    attn_mask = raw_mask
                elif hasattr(model, "_get_feature_vector_attention_mask"):
                    attn_mask = model._get_feature_vector_attention_mask(
                        layer_state.shape[1], raw_mask
                    )
            
            # 池化操作
            if pooling == 'mean':
                # 使用attention mask计算有效长度的均值
                if attn_mask is not None:
                    mask = attn_mask.unsqueeze(-1)  # [batch, seq_len, 1]
                    sum_state = (layer_state * mask).sum(dim=1)    # [batch, hidden_dim]
                    pooling_state = sum_state / mask.sum(dim=1)    # [batch, hidden_dim]
                else:
                    # 如果没有mask，简单计算均值
                    pooling_state = layer_state.mean(dim=1)        # [batch, hidden_dim]
                    
            elif pooling == 'last':
                # 取最后一个有效时间步
                if attn_mask is not None:
                    last_token_inds = attn_mask.sum(dim=1) - 1  # [batch]
                    pooling_state = layer_state[
                        torch.arange(last_token_inds.shape[0], device=device),
                        last_token_inds
                    ]  # [batch, hidden_dim]
                else:
                    # 如果没有mask，取序列最后一个
                    pooling_state = layer_state[:, -1, :]  # [batch, hidden_dim]
            
            # 存储到CPU
            hidden_states[layer_idx].append(pooling_state.cpu().float().numpy())
        
        # 7. 定期清理显存（可选）
        if (ii + 1) % 50 == 0:
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
    
    # 8. 合并所有批次的特征
    layer_features = {
        layer_idx: np.concatenate(states, axis=0) 
        for layer_idx, states in hidden_states.items()
    }
    
    return layer_features

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


def fit_encoding_single(X: np.ndarray, y: np.ndarray,
                        excluded_start: int = 5, excluded_end: int = 5,
                        alpha: float = 10000.0,
                        test_ratio: float = 0.2
                        ) -> tuple[Ridge, np.ndarray]:
    """
    单次划分训练/测试，避免K折交叉验证带来的开销.
    """
    X, y = X[excluded_start: -excluded_end], y[excluded_start: -excluded_end]
    n = X.shape[0]
    split = int(n * (1 - test_ratio))
    if split <= 0 or split >= n:
        raise ValueError("Invalid test_ratio for current sample size.")
    X_train, y_train = X[:split], y[:split]
    X_test, y_test = X[split:], y[split:]

    model = Ridge(alpha=alpha)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    corrs = corr_with_np(y_pred, y_test)
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
