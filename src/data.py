from __future__ import annotations

from pathlib import Path
import numpy as np
import pandas as pd
import librosa

from src.config import DATA_ROOT, TR_SECONDS, AUDIO_SR


def load_fmri(path: Path | None = None) -> dict:
    fmri_path = path or (DATA_ROOT / "21styear_all_subs_rois.npy")
    return np.load(fmri_path, allow_pickle=True).item()


def load_align_df(path: Path | None = None, tr_seconds: float = TR_SECONDS) -> pd.DataFrame:
    align_path = path or (DATA_ROOT / "21styear_align.csv")
    df = pd.read_csv(align_path, header=None, names=["cased", "uncased", "start_ts", "end_ts"])
    df.cased = df.cased.fillna("none")
    df.end_ts = df.end_ts.bfill()
    df.start_ts = df.start_ts.bfill()
    df["tr"] = df.start_ts.apply(lambda x: int(np.ceil(x / tr_seconds)))
    return df


def load_audio(path: Path | None = None, sr: int = AUDIO_SR) -> tuple[np.ndarray, int]:
    audio_path = path or (DATA_ROOT / "21styear_audio.wav")
    wav, sr = librosa.load(audio_path.as_posix(), sr=sr)
    return wav, sr
