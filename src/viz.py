from __future__ import annotations

from pathlib import Path
from typing import Tuple

import numpy as np
import nibabel as nib


def _load_surf(atlas_root: Path, hemi: str, kind: str = "inflated") -> Tuple[np.ndarray, np.ndarray]:
    surf = atlas_root / "atlases" / "fsaverage" / f"tpl-fsaverage_den-41k_hemi-{hemi}_{kind}.surf.gii"
    if not surf.exists():
        raise FileNotFoundError(f"Missing surface: {surf}")
    gii = nib.load(surf)
    coords = np.asarray(gii.darrays[0].data)
    faces = np.asarray(gii.darrays[1].data)
    return coords, faces


def _load_sulc(atlas_root: Path, hemi: str) -> np.ndarray | None:
    sulc = atlas_root / "atlases" / "fsaverage" / f"tpl-fsaverage_den-41k_hemi-{hemi}_desc-sulc_midthickness.shape.gii"
    if not sulc.exists():
        return None
    return np.asarray(nib.load(sulc).agg_data())


def _load_mmp_labels(atlas_root: Path, hemi: str) -> np.ndarray:
    label = atlas_root / f"tpl-fsaverage6_hemi-{hemi}_desc-MMP_dseg.label.gii"
    if not label.exists():
        raise FileNotFoundError(f"Missing label GIFTI: {label}")
    return np.asarray(nib.load(label).agg_data()).astype(int)


def _roi_to_vertex_values(corr_map: np.ndarray, labels: np.ndarray, hemi: str) -> np.ndarray:
    """
    corr_map:
      - len==360: [L180, R180]
      - len==180: each hemi independently
    labels: 0..180 (0=medialwall)
    """
    if corr_map.ndim != 1:
        corr_map = corr_map.reshape(-1)
    if corr_map.shape[0] == 360:
        corr = corr_map[:180] if hemi == "L" else corr_map[180:]
    elif corr_map.shape[0] == 180:
        corr = corr_map
    else:
        raise ValueError(f"Unsupported corr_map length={corr_map.shape[0]} for ROI plotting.")

    out = np.full(labels.shape[0], np.nan, dtype=np.float32)
    for roi in range(1, 181):
        out[labels == roi] = float(corr[roi - 1])
    return out


def _project_front(coords: np.ndarray, hemi: str, view: str) -> tuple[np.ndarray, np.ndarray]:
    """
    Produce a stable "front-on" 2D projection for surface rendering.
    Use (y, z) plane so the view is orthographic along x (left-right).
    view in {"lateral", "medial"} controls mirroring so both hemispheres face outward.
    """
    y = coords[:, 1].copy()
    z = coords[:, 2].copy()
    if view not in ("lateral", "medial"):
        raise ValueError(f"Unknown view: {view}")

    # Make lateral views look outward, medial inward, with consistent left-right orientation.
    if hemi == "L":
        x2d = -y if view == "lateral" else y
    else:
        x2d = y if view == "lateral" else -y
    y2d = z
    return x2d, y2d


def save_corr_map(corr_map: np.ndarray, atlas_root: Path, out_file: Path) -> None:
    """
    Render a cortical map to PNG using only matplotlib (no VTK/brainspace).
    Designed for ROI-level corr maps (HCP-MMP 360), with clear lateral/medial views.
    """
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.tri as mtri

    out_file = Path(out_file)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    coords_L, faces_L = _load_surf(atlas_root, "L", kind="inflated")
    coords_R, faces_R = _load_surf(atlas_root, "R", kind="inflated")
    sulc_L = _load_sulc(atlas_root, "L")
    sulc_R = _load_sulc(atlas_root, "R")
    labels_L = _load_mmp_labels(atlas_root, "L")
    labels_R = _load_mmp_labels(atlas_root, "R")

    data_L = _roi_to_vertex_values(corr_map, labels_L, "L")
    data_R = _roi_to_vertex_values(corr_map, labels_R, "R")

    finite = np.concatenate([data_L[np.isfinite(data_L)], data_R[np.isfinite(data_R)]])
    if finite.size == 0:
        vmin, vmax = 0.0, 1.0
    else:
        vmax = float(np.nanpercentile(finite, 99))
        vmin = float(np.nanpercentile(finite, 1))
        if vmax <= vmin:
            vmax = float(np.nanmax(finite))
            vmin = float(np.nanmin(finite))

    def _plot(ax, coords, faces, sulc, values, hemi: str, view: str, title: str):
        x2d, y2d = _project_front(coords, hemi=hemi, view=view)
        tri = mtri.Triangulation(x2d, y2d, triangles=faces)
        ax.set_aspect("equal")
        ax.axis("off")
        if sulc is not None:
            s = sulc.copy()
            s = (s - np.nanmin(s)) / (np.nanmax(s) - np.nanmin(s) + 1e-8)
            ax.tripcolor(tri, s, shading="gouraud", cmap="Greys", vmin=0.0, vmax=1.0)
        im = ax.tripcolor(tri, values, shading="gouraud", cmap="coolwarm", vmin=vmin, vmax=vmax)
        ax.set_title(title, fontsize=10)
        return im

    fig = plt.figure(figsize=(12, 4.6), dpi=220)
    gs = fig.add_gridspec(2, 2, wspace=0.02, hspace=0.10)
    ax1 = fig.add_subplot(gs[0, 0])
    ax2 = fig.add_subplot(gs[0, 1])
    ax3 = fig.add_subplot(gs[1, 0])
    ax4 = fig.add_subplot(gs[1, 1])

    im = _plot(ax1, coords_L, faces_L, sulc_L, data_L, hemi="L", view="lateral", title="Left (lateral)")
    _plot(ax2, coords_L, faces_L, sulc_L, data_L, hemi="L", view="medial", title="Left (medial)")
    _plot(ax3, coords_R, faces_R, sulc_R, data_R, hemi="R", view="medial", title="Right (medial)")
    _plot(ax4, coords_R, faces_R, sulc_R, data_R, hemi="R", view="lateral", title="Right (lateral)")

    cbar = fig.colorbar(im, ax=[ax1, ax2, ax3, ax4], shrink=0.72, pad=0.01)
    cbar.set_label("Correlation", fontsize=9)
    fig.savefig(out_file.as_posix(), facecolor="white", bbox_inches="tight")
    plt.close(fig)
