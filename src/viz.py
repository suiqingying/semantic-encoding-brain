from __future__ import annotations

from pathlib import Path
import numpy as np

from brainspace.plotting.surface_plotting import plot_hemispheres
from brainspace.mesh.mesh_io import read_surface
from neuromaps.datasets import fetch_atlas

from src.utils import extract_hemi_data_from_files


def save_corr_map(corr_map: np.ndarray, atlas_root: Path, out_file: Path) -> None:
    fslr = fetch_atlas("fsaverage", "41k", data_dir=atlas_root.as_posix())
    surf_lh = read_surface(str(fslr["inflated"].L))
    surf_rh = read_surface(str(fslr["inflated"].R))

    tpl_files = list(atlas_root.glob("*MMP*gii"))
    if not tpl_files:
        raise FileNotFoundError("Missing atlas GIFTI files in data/atlas")

    whole_brain_rois = extract_hemi_data_from_files(tpl_files, is_label=True, return_list=False).astype(int)
    whole_brain_corrs = np.zeros(whole_brain_rois.shape, dtype=np.float32)

    for roi_ind in np.unique(whole_brain_rois[whole_brain_rois != 0]):
        whole_brain_corrs[whole_brain_rois == roi_ind] = corr_map[roi_ind - 1]

    whole_brain_corrs[whole_brain_rois == 0] = np.nan
    whole_brain_corrs[whole_brain_corrs < 0.0] = np.nan

    out_file.parent.mkdir(parents=True, exist_ok=True)
    plot_hemispheres(
        surf_lh, surf_rh,
        array_name=whole_brain_corrs,
        nan_color=(0.8, 0.8, 0.8, 1),
        background=(1, 1, 1),
        size=(1000, 300),
        embed_nb=False,
        color_bar=False,
        interactive=False,
        transparent_bg=False,
        cmap="coolwarm",
        zoom=1.2,
        screenshot=True,
        filename=out_file.as_posix(),
        suppress_warnings=True,
    )
