from __future__ import annotations

from pathlib import Path

TR_SECONDS = 1.5
AUDIO_SR = 16000
DEFAULT_ALPHAS = [10000.0, 100000.0, 1000000.0]
DEFAULT_FIR_WINDOW = 4
DEFAULT_FIR_OFFSET = 1
DEFAULT_PCA_DIM = 250
DEFAULT_KFOLD = 1
SUBJECTS = [
    75, 131, 190, 201, 235, 244, 249, 254, 255, 256, 257, 258, 259, 260,
    261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271
]


def get_project_root() -> Path:
    here = Path(__file__).resolve()
    for parent in [here.parent] + list(here.parents):
        if (parent / "src").is_dir():
            return parent
    return here.parent


PROJECT_ROOT = get_project_root()
DATA_ROOT = PROJECT_ROOT / "data" / "raw"
ATLAS_ROOT = PROJECT_ROOT / "data" / "atlas"
RESULTS_ROOT = PROJECT_ROOT / "results"
