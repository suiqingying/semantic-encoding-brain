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

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r1 = 0
  let g1 = 0
  let b1 = 0
  if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0]
  else if (hp >= 1 && hp < 2) [r1, g1, b1] = [x, c, 0]
  else if (hp >= 2 && hp < 3) [r1, g1, b1] = [0, c, x]
  else if (hp >= 3 && hp < 4) [r1, g1, b1] = [0, x, c]
  else if (hp >= 4 && hp < 5) [r1, g1, b1] = [x, 0, c]
  else if (hp >= 5 && hp < 6) [r1, g1, b1] = [c, 0, x]
  const m = l - c / 2
  return [r1 + m, g1 + m, b1 + m]
}

function roiBaseColor(id) {
  if (!id) return [0.84, 0.82, 0.78]
  const t = (id * 0.1337) % 1
  const blue = [0.176, 0.427, 0.651]
  const orange = [0.85, 0.54, 0.17]
  const mixed = [
    blue[0] * (1 - t) + orange[0] * t,
    blue[1] * (1 - t) + orange[1] * t,
    blue[2] * (1 - t) + orange[2] * t,
  ]
  const lift = 0.12
  return mixed.map((c) => c * (1 - lift) + lift)
}

function Brain2DMap({ surfaceUrl, labelUrl }) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const pickSceneRef = useRef(null)
  const cameraRef = useRef(null)
  const meshRef = useRef(null)
  const pickMeshRef = useRef(null)
  const pickTargetRef = useRef(null)
  const fitRef = useRef(null)
  const selectedRef = useRef(null)
  const hoverRef = useRef(null)

  const [error, setError] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f0)
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

    window.addEventListener('resize', resize)
    resize()
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      pickTargetRef.current?.dispose?.()
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

        const geom = new THREE.BufferGeometry()
        geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
        geom.setIndex(new THREE.BufferAttribute(triangles, 1))
        geom.computeVertexNormals()

        const colors = new Float32Array((vertices.length / 3) * 3)
        const base = new Float32Array(colors.length)
        for (let i = 0; i < labels.length; i++) {
          const [r, g, b] = roiBaseColor(labels[i])
          base[i * 3] = r
          base[i * 3 + 1] = g
          base[i * 3 + 2] = b
          colors[i * 3] = r
          colors[i * 3 + 1] = g
          colors[i * 3 + 2] = b
        }
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }))
        mesh.userData.base = base

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

        const scene = sceneRef.current
        const pickScene = pickSceneRef.current
        const old = meshRef.current
        const oldPick = pickMeshRef.current
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

        scene.add(mesh)
        pickScene.add(pickMesh)
        meshRef.current = mesh
        pickMeshRef.current = pickMesh

        const cam = cameraRef.current
        const pos = geom.getAttribute('position')
        let minY = Infinity
        let maxY = -Infinity
        let minZ = Infinity
        let maxZ = -Infinity
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i)
          const z = pos.getZ(i)
          if (y < minY) minY = y
          if (y > maxY) maxY = y
          if (z < minZ) minZ = z
          if (z > maxZ) maxZ = z
        }
        fitRef.current = { halfY: (maxY - minY) / 2, halfZ: (maxZ - minZ) / 2 }

        cam.position.set(200, 0, 0)
        cam.up.set(0, 0, 1)
        cam.lookAt(0, 0, 0)
        cam.near = 0.1
        cam.far = 10000
        cam.updateProjectionMatrix()

        selectedRef.current = null
        hoverRef.current = null

        const canvas = canvasRef.current
        if (canvas && rendererRef.current) {
          const w = canvas.clientWidth
          const h = canvas.clientHeight
          pickTargetRef.current?.dispose?.()
          pickTargetRef.current = new THREE.WebGLRenderTarget(w, h, { depthBuffer: true, stencilBuffer: false })
          rendererRef.current.setSize(w, h, false)

          const aspect = w / Math.max(h, 1)
          const margin = 1.08
          let halfH = fitRef.current.halfY * margin
          let halfW = fitRef.current.halfZ * margin
          if (halfW / halfH < aspect) halfW = halfH * aspect
          else halfH = halfW / aspect
          cam.left = -halfW
          cam.right = halfW
          cam.top = halfH
          cam.bottom = -halfH
          cam.updateProjectionMatrix()
        }
      } catch (e) {
        if (canceled) return
        setError(e?.message || String(e))
      }
    }

    load()
    return () => {
      canceled = true
    }
  }, [surfaceUrl, labelUrl])

  const pickAt = (x, y) => {
    const renderer = rendererRef.current
    const cam = cameraRef.current
    const pickScene = pickSceneRef.current
    const target = pickTargetRef.current
    if (!renderer || !cam || !pickScene || !target) return null

    const pixelRatio = renderer.getPixelRatio()
    const px = Math.floor(x * pixelRatio)
    const py = Math.floor((target.height - y) * pixelRatio)

    renderer.setRenderTarget(target)
    renderer.render(pickScene, cam)
    const buf = new Uint8Array(4)
    renderer.readRenderTargetPixels(target, px, py, 1, 1, buf)
    renderer.setRenderTarget(null)
    const id = decodeRgbToId(buf[0], buf[1], buf[2])
    return id || null
  }

  const applyHighlight = (selected, hover) => {
    const mesh = meshRef.current
    const pickMesh = pickMeshRef.current
    if (!mesh || !pickMesh) return

    const pickGeom = pickMesh.geometry
    const pickColors = pickGeom.getAttribute('color')
    const geom = mesh.geometry
    const colors = geom.getAttribute('color')
    const base = mesh.userData.base

    const selectedId = selected || null
    const hoverId = hover || null

    for (let i = 0; i < pickColors.count; i++) {
      const r = pickColors.getX(i)
      const g = pickColors.getY(i)
      const b = pickColors.getZ(i)
      const id = decodeRgbToId(r, g, b)
      const idx = i * 3
      let rr = base[idx]
      let gg = base[idx + 1]
      let bb = base[idx + 2]
      if (id && hoverId && id === hoverId) {
        rr = Math.min(1, rr + 0.20)
        gg = Math.min(1, gg + 0.20)
        bb = Math.min(1, bb + 0.20)
      }
      if (id && selectedId && id === selectedId) {
        rr = 1
        gg = 1
        bb = 1
      }
      colors.setXYZ(i, rr, gg, bb)
    }
    colors.needsUpdate = true
  }

  const onMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = pickAt(x, y)
    if (hoverRef.current !== id) {
      hoverRef.current = id
      applyHighlight(selectedRef.current, hoverRef.current)
    }
  }

  const onClick = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = pickAt(x, y)
    selectedRef.current = id
    applyHighlight(selectedRef.current, hoverRef.current)
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        selectedRef.current = null
        applyHighlight(selectedRef.current, hoverRef.current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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

  return (
    <>
      <div className="slideCanvas">
        <canvas ref={canvasRef} className="canvas" onClick={onClick} onMouseMove={onMove} />
      </div>
      {errorOverlay}
    </>
  )
}

export default function Slide18AcousticModel() {
  const title = '声学 ROI 交互地图（Inflated）'

  return (
    <div className="deck">
      <div className="slide nordSlide">
        <div className="nordAurora" aria-hidden="true">
          <div className="nordGlow nordGlowA" />
          <div className="nordGlow nordGlowB" />
        </div>

        <Brain2DMap surfaceUrl="/atlas/tpl-fsaverage_den-41k_hemi-L_inflated.surf.gii" labelUrl="/atlas/tpl-fsaverage6_hemi-L_desc-MMP_dseg.label.gii" />

        <div className="nordContent" style={{ justifyContent: 'flex-start', paddingTop: 54 }}>
          <div data-stagger="" style={{ ...{ '--stagger-delay': '0ms' }, fontSize: 56, fontWeight: 950, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            {title}
          </div>
        </div>
      </div>
    </div>
  )
}








