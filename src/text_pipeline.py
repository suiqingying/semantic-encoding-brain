from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from typing import Iterable, Literal

import numpy as np
import pandas as pd
import torch
from transformers import PreTrainedTokenizer, PreTrainedModel
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

from src.utils import extract_text_features


def build_context_tokens(df: pd.DataFrame, tokenizer: PreTrainedTokenizer, ctx_words: int) -> list[list[str]]:
    token_ids: list[str] = []
    token_with_ctx: list[list[str]] = []

    for idx in range(len(df)):
        token_id = tokenizer.tokenize(df.loc[idx, "cased"], add_special_tokens=False)
        token_ids.extend(token_id)
        ctx_start_idx = max(len(token_ids) - ctx_words, 0)
        token_with_ctx.append(token_ids[ctx_start_idx:])

    return token_with_ctx


def extract_text_layers(tokens: list[list[str]], tokenizer: PreTrainedTokenizer,
                        model: PreTrainedModel, layers: Iterable[int],
                        device: torch.device, batch_size: int,
                        autocast: bool, pooling: Literal["mean", "last"]) -> dict[int, np.ndarray]:
    return extract_text_features(
        tokens=tokens,
        tokenizer=tokenizer,
        model=model,
        layers=layers,
        device=device,
        batch_size=batch_size,
        autocast=autocast,
        pooling=pooling,
    )


def align_word_features_to_tr(df: pd.DataFrame, layer_feature: np.ndarray,
                              n_trs: int, pooling: Literal["mean"] = "mean") -> np.ndarray:
    first_tr, last_tr = int(df.tr.min()), int(df.tr.max())
    if pooling != "mean":
        raise ValueError("Only mean pooling is supported for TR alignment.")

    tr_means = df.groupby("tr").apply(lambda g: layer_feature[g.index].mean(0))
    tr_means = tr_means.reindex(range(first_tr, n_trs + 1))
    tr_means = tr_means.ffill()
    aligned = np.vstack(tr_means.to_numpy())

    if first_tr > 1:
        aligned = np.pad(aligned, ((first_tr - 1, 0), (0, 0)), mode="constant")
    if aligned.shape[0] < n_trs:
        aligned = np.pad(aligned, ((0, n_trs - aligned.shape[0]), (0, 0)), mode="edge")

    return aligned


def reduce_pca(features: np.ndarray, pca_dim: int) -> np.ndarray:
    scaler = StandardScaler()
    features_std = scaler.fit_transform(features)
    pca = PCA(n_components=pca_dim)
    return pca.fit_transform(features_std)


def save_layer_features(layer_features: dict[int, np.ndarray], out_dir: Path,
                        prefix: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for layer, features in layer_features.items():
        out_path = out_dir / f"{prefix}_layer{layer}_features.npy"
        np.save(out_path, features, allow_pickle=True)
