import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import pako from 'pako'

function decodeBase64ToUint8(b64) {
  const cleaned = (b64 || '').replace(/\s+/g, '')
  const binary = atob(cleaned)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function sliceArrayBuffer(u8) {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
}

function parseGiftiXml(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml')
  const dataArrays = Array.from(xml.getElementsByTagName('DataArray'))

  const arrays = []
  for (const da of dataArrays) {
    const intent = da.getAttribute('Intent') || ''
    const encoding = da.getAttribute('Encoding') || ''
    const dataType = da.getAttribute('DataType') || ''
    const dataEl = da.getElementsByTagName('Data')[0]
    if (!dataEl) continue

    let bytes = decodeBase64ToUint8(dataEl.textContent)
    if (encoding.includes('GZip')) bytes = pako.inflate(bytes)

    arrays.push({ intent, dataType, buffer: sliceArrayBuffer(bytes) })
  }

  return arrays
}

function parseSurfaceFromArrays(arrays) {
  let vertices = null
  let triangles = null

  for (const a of arrays) {
    if (a.intent === 'NIFTI_INTENT_POINTSET') vertices = new Float32Array(a.buffer)
    if (a.intent === 'NIFTI_INTENT_TRIANGLE') {
      const tri = a.dataType.includes('INT32') || a.dataType.includes('NIFTI_TYPE_INT32') ? new Int32Array(a.buffer) : new Int32Array(a.buffer)
      triangles = new Uint32Array(tri.length)
      for (let i = 0; i < tri.length; i++) triangles[i] = tri[i]
    }
  }

  if (!vertices || !triangles) throw new Error('表面解析失败：未找到 POINTSET / TRIANGLE')
  return { vertices, triangles }
}

function parseLabelsFromArrays(arrays) {
  for (const a of arrays) {
    const i32 = new Int32Array(a.buffer)
    if (i32.length > 1000) return i32
  }
  throw new Error('标签解析失败：未找到可用的 label array')
}

function encodeIdToRgb(id) {
  const r = id & 255
  const g = (id >> 8) & 255
  const b = (id >> 16) & 255
  return [r, g, b]
}

function decodeRgbToId(r, g, b) {
  return r + (g << 8) + (b << 16)
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

function clampRgb01(rgb) {
  return [clamp01(rgb[0]), clamp01(rgb[1]), clamp01(rgb[2])]
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function lerpRgb(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

function roiBaseColor(id, roiInfoById, { roiValueById, roiValueFn, colorLow, colorHigh }) {
  if (!id) return [0.84, 0.82, 0.78]
  const info = roiInfoById?.get?.(id) || null
  const v =
    (roiValueById && Object.prototype.hasOwnProperty.call(roiValueById, id) ? roiValueById[id] : undefined) ??
    (roiValueFn ? roiValueFn(id, info) : undefined)

  if (typeof v !== 'number' || !Number.isFinite(v)) return [0.84, 0.82, 0.78]
  const t = clamp01(v)
  return lerpRgb(colorLow, colorHigh, t)
}

export function Brain2DMap({
  surfaceUrl,
  labelUrl,
  onSelect,
  onHover,
  ariaLabel = 'ROI map',
  roiColorById,
  roiValueById,
  roiValueFn,
  colorLow = [0.176, 0.427, 0.651], // blue
  colorHigh = [0.85, 0.22, 0.22], // red
}) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const pickSceneRef = useRef(null)
  const cameraRef = useRef(null)
  const meshRef = useRef(null)
  const pickMeshRef = useRef(null)
  const outlineRef = useRef(null)
  const shellRef = useRef(null)
  const pickTargetRef = useRef(null)
  const fitRef = useRef(null)
  const selectedRef = useRef(null)
  const hoverRef = useRef(null)

  const [error, setError] = useState(null)

  const errorOverlay = useMemo(() => {
    if (!error) return null
    return (
      <div className="overlay">
        <div className="box">
          <div className="title">加载失败</div>
          <div className="msg">{error}</div>
        </div>
      </div>
    )
  }, [error])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = null
    sceneRef.current = scene

    const pickScene = new THREE.Scene()
    pickScene.background = new THREE.Color(0x000000)
    pickSceneRef.current = pickScene

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10000)
    cameraRef.current = camera

    const applyFit = () => {
      const fit = fitRef.current
      if (!fit) return

      const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1)
      const margin = 1.08
      let halfH = fit.halfY * margin
      let halfW = fit.halfZ * margin

      if (halfW / halfH < aspect) {
        halfW = halfH * aspect
      } else {
        halfH = halfW / aspect
      }

      camera.left = -halfW
      camera.right = halfW
      camera.top = halfH
      camera.bottom = -halfH
      camera.updateProjectionMatrix()
    }

    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      renderer.setSize(w, h, false)
      applyFit()

      const pickTarget = new THREE.WebGLRenderTarget(w, h, { depthBuffer: true, stencilBuffer: false })
      pickTargetRef.current?.dispose?.()
      pickTargetRef.current = pickTarget
    }

    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    window.addEventListener('resize', resize)
    resize()
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      ro.disconnect()
      pickTargetRef.current?.dispose?.()
      outlineRef.current?.geometry?.dispose?.()
      outlineRef.current?.material?.dispose?.()
      shellRef.current?.geometry?.dispose?.()
      shellRef.current?.material?.dispose?.()
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    let canceled = false

    async function load() {
      setError(null)
      try {
        const [surfResp, labelResp] = await Promise.all([fetch(surfaceUrl), fetch(labelUrl)])
        if (!surfResp.ok) throw new Error('表面文件加载失败：HTTP ' + surfResp.status)
        if (!labelResp.ok) throw new Error('标签文件加载失败：HTTP ' + labelResp.status)

        const [surfXml, labelXml] = await Promise.all([surfResp.text(), labelResp.text()])
        const { vertices, triangles } = parseSurfaceFromArrays(parseGiftiXml(surfXml))
        const labels = parseLabelsFromArrays(parseGiftiXml(labelXml))

        if (labels.length !== vertices.length / 3) {
          throw new Error(`标签长度(${labels.length})与顶点数(${vertices.length / 3})不一致，无法一一对应`)
        }
        if (canceled) return

        // Precompute ROI centroid in (y,z) and normalize to [0,1] for simple per-ROI heuristics.
        let minY = Infinity
        let maxY = -Infinity
        let minZ = Infinity
        let maxZ = -Infinity
        for (let i = 0; i < labels.length; i++) {
          const y = vertices[i * 3 + 1]
          const z = vertices[i * 3 + 2]
          if (y < minY) minY = y
          if (y > maxY) maxY = y
          if (z < minZ) minZ = z
          if (z > maxZ) maxZ = z
        }
        const roiAgg = new Map()
        for (let i = 0; i < labels.length; i++) {
          const id = labels[i] >>> 0
          let agg = roiAgg.get(id)
          if (!agg) {
            agg = { id, count: 0, sumY: 0, sumZ: 0 }
            roiAgg.set(id, agg)
          }
          agg.count += 1
          agg.sumY += vertices[i * 3 + 1]
          agg.sumZ += vertices[i * 3 + 2]
        }
        const roiInfoById = new Map()
        const ySpan = Math.max(1e-9, maxY - minY)
        const zSpan = Math.max(1e-9, maxZ - minZ)
        for (const agg of roiAgg.values()) {
          const cy = agg.sumY / agg.count
          const cz = agg.sumZ / agg.count
          roiInfoById.set(agg.id, {
            id: agg.id,
            count: agg.count,
            cy,
            cz,
            ny: (cy - minY) / ySpan,
            nz: (cz - minZ) / zSpan,
          })
        }

        const geom = new THREE.BufferGeometry()
        geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
        geom.setIndex(new THREE.BufferAttribute(triangles, 1))
        geom.computeVertexNormals()

        const colors = new Float32Array((vertices.length / 3) * 3)
        const base = new Float32Array(colors.length)
        for (let i = 0; i < labels.length; i++) {
          const roiId = labels[i] >>> 0
          const pre = roiColorById ? roiColorById[String(roiId)] : undefined
          const rgb = Array.isArray(pre) && pre.length === 3 ? clampRgb01(pre) : roiBaseColor(roiId, roiInfoById, { roiValueById, roiValueFn, colorLow, colorHigh })
          const [r, g, b] = rgb
          base[i * 3] = r
          base[i * 3 + 1] = g
          base[i * 3 + 2] = b
          colors[i * 3] = r
          colors[i * 3 + 1] = g
          colors[i * 3 + 2] = b
        }
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true }))
        mesh.userData.base = base
        mesh.userData.labels = labels
        mesh.userData.roiInfoById = roiInfoById

        const pickGeom = geom.clone()
        const pickColors = new Uint8Array((vertices.length / 3) * 3)
        for (let i = 0; i < labels.length; i++) {
          const id = labels[i] >>> 0
          const [r, g, b] = encodeIdToRgb(id)
          pickColors[i * 3] = r
          pickColors[i * 3 + 1] = g
          pickColors[i * 3 + 2] = b
        }
        pickGeom.setAttribute('color', new THREE.BufferAttribute(pickColors, 3, true))
        const pickMesh = new THREE.Mesh(pickGeom, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }))

        // Build ROI boundary outlines: edges where adjacent vertices have different non-zero labels.
        const roiEdges = new Set()
        const idx = triangles
        const pos = vertices
        const roiPositions = []
        const pushEdge = (edges, positions, a, b) => {
          const min = a < b ? a : b
          const max = a < b ? b : a
          const key = (min << 16) | max
          if (edges.has(key)) return
          edges.add(key)
          const ax = pos[min * 3]
          const ay = pos[min * 3 + 1]
          const az = pos[min * 3 + 2]
          const bx = pos[max * 3]
          const by = pos[max * 3 + 1]
          const bz = pos[max * 3 + 2]
          positions.push(ax, ay, az, bx, by, bz)
        }
        for (let t = 0; t < idx.length; t += 3) {
          const a = idx[t]
          const b = idx[t + 1]
          const c = idx[t + 2]
          const la = labels[a]
          const lb = labels[b]
          const lc = labels[c]
          if (la !== lb) {
            if (la !== 0 && lb !== 0) pushEdge(roiEdges, roiPositions, a, b)
          }
          if (lb !== lc) {
            if (lb !== 0 && lc !== 0) pushEdge(roiEdges, roiPositions, b, c)
          }
          if (lc !== la) {
            if (lc !== 0 && la !== 0) pushEdge(roiEdges, roiPositions, c, a)
          }
        }
        const outlineGeom = new THREE.BufferGeometry()
        outlineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(roiPositions), 3))
        const outlineMat = new THREE.LineBasicMaterial({ color: 0x233044, transparent: true, opacity: 0.16, depthTest: true, depthWrite: false })
        const outline = new THREE.LineSegments(outlineGeom, outlineMat)
        outline.renderOrder = 2
        
        // Outer silhouette outline: a slightly scaled back-face mesh in black.
        const shellMat = new THREE.MeshBasicMaterial({
          color: 0x000000,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.55,
          depthTest: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        })
        const shell = new THREE.Mesh(geom, shellMat)
        shell.scale.set(1.008, 1.008, 1.008)
        shell.renderOrder = 0

        const scene = sceneRef.current
        const pickScene = pickSceneRef.current
        const old = meshRef.current
        const oldPick = pickMeshRef.current
        const oldOutline = outlineRef.current
        const oldShell = shellRef.current
        if (old) {
          scene.remove(old)
          old.geometry.dispose()
          old.material.dispose()
        }
        if (oldPick) {
          pickScene.remove(oldPick)
          oldPick.geometry.dispose()
          oldPick.material.dispose()
        }
        if (oldOutline) {
          scene.remove(oldOutline)
          oldOutline.geometry.dispose()
          oldOutline.material.dispose()
        }
        if (oldShell) {
          scene.remove(oldShell)
          oldShell.geometry.dispose()
          oldShell.material.dispose()
        }

        scene.add(shell)
        scene.add(mesh)
        scene.add(outline)
        pickScene.add(pickMesh)
        meshRef.current = mesh
        pickMeshRef.current = pickMesh
        outlineRef.current = outline
        shellRef.current = shell

        const box = new THREE.Box3().setFromObject(mesh)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)
        const min = box.min
        const max = box.max
        const maxDim = Math.max(size.x, size.y, size.z)
        const camera = cameraRef.current
        camera.up.set(0, 0, 1)
        const isLeft = center.x < 0
        const outerX = isLeft ? min.x : max.x
        camera.position.set(outerX + (isLeft ? -1 : 1) * maxDim * 1.6, center.y, center.z)
        camera.lookAt(center)
        const d = camera.position.distanceTo(center)
        camera.near = 0.1
        camera.far = d + maxDim * 10

        fitRef.current = { halfY: size.y / 2, halfZ: size.z / 2 }
        const canvas = canvasRef.current
        if (canvas) {
          const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1)
          const margin = 1.08
          let halfH = (size.y / 2) * margin
          let halfW = (size.z / 2) * margin
          if (halfW / halfH < aspect) halfW = halfH * aspect
          else halfH = halfW / aspect
          camera.left = -halfW
          camera.right = halfW
          camera.top = halfH
          camera.bottom = -halfH
        }
        camera.updateProjectionMatrix()

        selectedRef.current = null
        hoverRef.current = null
        onSelect?.(null)
        onHover?.(null)
      } catch (e) {
        if (canceled) return
        setError(e?.message || String(e))
      }
    }

    load()
    return () => {
      canceled = true
    }
  }, [surfaceUrl, labelUrl, onHover, onSelect, roiColorById, roiValueById, roiValueFn, colorLow, colorHigh])

  const applyHighlight = (selectedId, hoverId) => {
    const mesh = meshRef.current
    if (!mesh) return

    const labels = mesh.userData.labels
    const colors = mesh.geometry.getAttribute('color')
    const base = mesh.userData.base

    for (let i = 0; i < labels.length; i++) {
      const id = labels[i]
      const idx = i * 3
      let r = base[idx]
      let g = base[idx + 1]
      let b = base[idx + 2]
      if (hoverId != null && id === hoverId && selectedId == null) {
        r = Math.min(1, r + 0.12)
        g = Math.min(1, g + 0.12)
        b = Math.min(1, b + 0.12)
      }
      if (selectedId != null && id === selectedId) {
        const dark = 0.55
        r *= dark
        g *= dark
        b *= dark
      }
      colors.setXYZ(i, r, g, b)
    }
    colors.needsUpdate = true
  }

  const pickRoiAt = (clientX, clientY) => {
    const renderer = rendererRef.current
    const camera = cameraRef.current
    const pickScene = pickSceneRef.current
    const target = pickTargetRef.current
    const canvas = canvasRef.current
    if (!renderer || !camera || !pickScene || !target || !canvas) return null

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((clientX - rect.left) / rect.width) * target.width)
    const y = Math.floor((1 - (clientY - rect.top) / rect.height) * target.height)

    renderer.setRenderTarget(target)
    renderer.render(pickScene, camera)
    renderer.setRenderTarget(null)

    const pixel = new Uint8Array(4)
    renderer.readRenderTargetPixels(target, x, y, 1, 1, pixel)
    const id = decodeRgbToId(pixel[0], pixel[1], pixel[2])
    return id === 0 ? null : id
  }

  const onClick = (e) => {
    const id = pickRoiAt(e.clientX, e.clientY)
    if (id == null) {
      applyHighlight(selectedRef.current, hoverRef.current)
      return
    }
    selectedRef.current = id
    onSelect?.(id)
    applyHighlight(selectedRef.current, hoverRef.current)
  }

  const onMove = (e) => {
    const id = pickRoiAt(e.clientX, e.clientY)
    if (id !== hoverRef.current) {
      hoverRef.current = id
      onHover?.(id)
      applyHighlight(selectedRef.current, hoverRef.current)
    }
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        selectedRef.current = null
        onSelect?.(null)
        applyHighlight(selectedRef.current, hoverRef.current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onSelect])

  return (
    <>
      <div className="slideCanvas" aria-label={ariaLabel}>
        <canvas ref={canvasRef} className="canvas" onClick={onClick} onMouseMove={onMove} />
      </div>
      {errorOverlay}
    </>
  )
}
