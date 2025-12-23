from __future__ import annotations

from pathlib import Path
from typing import Iterable, Literal

import numpy as np
import torch
from transformers import PreTrainedModel

from src.utils import extract_audio_features


def chunk_audio(wav: np.ndarray, sr: int, n_trs: int, tr_seconds: float, tr_win: int) -> torch.Tensor:
    wav_tensor = torch.from_numpy(wav)
    tr_frames = int(sr * tr_seconds)
    audio_chunks = wav_tensor.flip(0).unfold(0, tr_frames * tr_win, tr_frames).flip([0, 1])
    num_chunks = audio_chunks.shape[0]
    pad_count = n_trs - num_chunks
    if pad_count > 0:
        pad_chunk = audio_chunks[0].unsqueeze(0).repeat(pad_count, 1)
        audio_chunks = torch.cat([pad_chunk, audio_chunks], dim=0)
    return audio_chunks


def extract_audio_layers(audio_chunks: torch.Tensor, processor,
                         model: PreTrainedModel, layers: Iterable[int],
                         device: torch.device, batch_size: int,
                         autocast: bool, pooling: Literal["mean", "last"],
                         sampling_rate: int) -> dict[int, np.ndarray]:
    return extract_audio_features(
        audio_chunks=audio_chunks,
        processor=processor,
        model=model,
        layers=layers,
        device=device,
        batch_size=batch_size,
        autocast=autocast,
        pooling=pooling,
        sampling_rate=sampling_rate,
    )


def save_layer_features(layer_features: dict[int, np.ndarray], out_dir: Path,
                        prefix: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for layer, features in layer_features.items():
        out_path = out_dir / f"{prefix}_layer{layer}_features.npy"
        np.save(out_path, features, allow_pickle=True)
