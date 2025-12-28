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

function Brain2DMap({ surfaceUrl, labelUrl, onSelect, onHover }) {
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

  const [loadState, setLoadState] = useState({ loading: true, error: null })

  const errorOverlay = useMemo(() => {
    if (!loadState.error) return null
    return { t: '加载失败', m: loadState.error }
  }, [loadState.error])

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
      setLoadState({ loading: true, error: null })
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

        // Fixed lateral view
        const box = new THREE.Box3().setFromObject(mesh)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)
        const min = box.min
        const max = box.max
        const maxDim = Math.max(size.x, size.y, size.z)
        const camera = cameraRef.current
        // Classic lateral silhouette: look along X, Z is up.
        camera.up.set(0, 0, 1)
        const isLeft = center.x < 0
        const outerX = isLeft ? min.x : max.x
        camera.position.set(outerX + (isLeft ? -1 : 1) * maxDim * 1.6, center.y, center.z)
        camera.lookAt(center)
        const d = camera.position.distanceTo(center)
        camera.near = 0.1
        camera.far = d + maxDim * 10

        fitRef.current = { halfY: size.y / 2, halfZ: size.z / 2 }
        // Update orthographic frustum to fit mesh in view
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

        mesh.userData.labels = labels
        selectedRef.current = null
        hoverRef.current = null

        onSelect?.(null)
        onHover?.(null)
        setLoadState({ loading: false, error: null })
      } catch (e) {
        if (canceled) return
        setLoadState({ loading: false, error: e?.message || String(e) })
      }
    }

    load()
    return () => {
      canceled = true
    }
  }, [surfaceUrl, labelUrl, onSelect, onHover])

  function recolor(selectedId) {
    const mesh = meshRef.current
    if (!mesh) return

    const labels = mesh.userData.labels
    const colors = mesh.geometry.getAttribute('color')
    const base = mesh.userData.base

    for (let i = 0; i < labels.length; i++) {
      const isSelected = selectedId != null && labels[i] === selectedId
      const isHover = hoverRef.current != null && labels[i] === hoverRef.current
      if (isSelected) {
        colors.setXYZ(i, 0.85, 0.54, 0.17)
      } else if (isHover && selectedId == null) {
        colors.setXYZ(i, 0.92, 0.7, 0.32)
      } else {
        const r = base[i * 3]
        const g = base[i * 3 + 1]
        const b = base[i * 3 + 2]
        if (selectedId != null) colors.setXYZ(i, r * 0.25, g * 0.25, b * 0.25)
        else colors.setXYZ(i, r, g, b)
      }
    }
    colors.needsUpdate = true
  }

  function pickRoiAt(clientX, clientY) {
    const renderer = rendererRef.current
    const camera = cameraRef.current
    const pickScene = pickSceneRef.current
    const pickTarget = pickTargetRef.current
    const canvas = canvasRef.current
    if (!renderer || !camera || !pickScene || !pickTarget || !canvas) return null

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((clientX - rect.left) / rect.width) * pickTarget.width)
    const y = Math.floor((1 - (clientY - rect.top) / rect.height) * pickTarget.height)

    renderer.setRenderTarget(pickTarget)
    renderer.render(pickScene, camera)
    renderer.setRenderTarget(null)

    const pixel = new Uint8Array(4)
    renderer.readRenderTargetPixels(pickTarget, x, y, 1, 1, pixel)
    const id = decodeRgbToId(pixel[0], pixel[1], pixel[2])
    return id === 0 ? null : id
  }

  function onClick(e) {
    if (overlay) return
    const id = pickRoiAt(e.clientX, e.clientY)
    selectedRef.current = id
    onSelect?.(id)
    recolor(id)
  }

  function onMove(e) {
    if (overlay) return
    const id = pickRoiAt(e.clientX, e.clientY)
    if (id !== hoverRef.current) {
      hoverRef.current = id
      onHover?.(id)
      recolor(selectedRef.current)
    }
  }

  return (
    <>
      <div className="slideCanvas">
        <canvas ref={canvasRef} className="canvas" onClick={onClick} onMouseMove={onMove} />
      </div>
      {errorOverlay ? (
        <div className="overlay">
          <div className="box">
            <div className="title">{errorOverlay.t}</div>
            <div className="msg">{errorOverlay.m}</div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default function Slide17SemanticModel() {
  const title = '语义 ROI 交互地图（Pial）'

  return (
    <div className="deck">
      <div className="slide nordSlide">
        <div className="nordAurora" aria-hidden="true">
          <div className="nordGlow nordGlowA" />
          <div className="nordGlow nordGlowB" />
        </div>

        <Brain2DMap surfaceUrl="/atlas/tpl-fsaverage_den-41k_hemi-L_pial.surf.gii" labelUrl="/atlas/tpl-fsaverage6_hemi-L_desc-MMP_dseg.label.gii" />

        <div className="nordContent" style={{ justifyContent: 'flex-start', paddingTop: 54 }}>
          <div data-stagger="" style={{ ...{ '--stagger-delay': '0ms' }, fontSize: 56, fontWeight: 950, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            {title}
          </div>
        </div>
      </div>
    </div>
  )
}








