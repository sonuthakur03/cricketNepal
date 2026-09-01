// src/components/three/PitchNepalLogo3D.jsx
// Pure 3D Logo Emblem for Hero: 3D Golden Wicket Stumps + PN Monogram Medallion + Gyroscope Orbit Rings + Gold Stardust

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, Stars } from '@react-three/drei'
import * as THREE from 'three'

/* ── Gold Material Presets ───────────────────────────────────── */
const GOLD_POLISHED = {
  color: '#ECC84A',
  metalness: 0.98,
  roughness: 0.08,
  emissive: '#A07820',
  emissiveIntensity: 0.25,
}

const GOLD_DARK = {
  color: '#B8860B',
  metalness: 0.92,
  roughness: 0.18,
}

const SHIELD_BASE = {
  color: '#0E0E0E',
  metalness: 0.9,
  roughness: 0.15,
}

/* ── 3D Wicket Stumps and Bails ──────────────────────────────── */
function Stumps3D() {
  const stumpX = [-0.34, 0, 0.34]

  return (
    <group position={[0, 0.05, 0.12]}>
      {/* 3 Stumps */}
      {stumpX.map((x, i) => (
        <group key={`stump-${i}`} position={[x, 0, 0]}>
          {/* Main Stump Pillar */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.042, 0.045, 1.25, 24]} />
            <meshStandardMaterial {...GOLD_POLISHED} />
          </mesh>
          {/* Top Spire Tip */}
          <mesh position={[0, 0.65, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial {...GOLD_POLISHED} />
          </mesh>
          {/* Base Joint */}
          <mesh position={[0, -0.63, 0]}>
            <cylinderGeometry args={[0.05, 0.055, 0.08, 16]} />
            <meshStandardMaterial {...GOLD_POLISHED} />
          </mesh>
        </group>
      ))}

      {/* Bail 1 (Left) */}
      <mesh position={[-0.17, 0.68, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.024, 0.024, 0.38, 16]} />
        <meshStandardMaterial {...GOLD_POLISHED} />
      </mesh>

      {/* Bail 2 (Right) */}
      <mesh position={[0.17, 0.68, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.024, 0.024, 0.38, 16]} />
        <meshStandardMaterial {...GOLD_POLISHED} />
      </mesh>

      {/* Ground Base Bar */}
      <mesh position={[0, -0.66, 0]}>
        <boxGeometry args={[0.95, 0.06, 0.16]} />
        <meshStandardMaterial {...GOLD_POLISHED} />
      </mesh>
    </group>
  )
}

/* ── "PN" Monogram Lettering Geometry ────────────────────────── */
function MonogramPN() {
  return (
    <group position={[0, -0.9, 0.14]}>
      {/* Letter 'P' */}
      <group position={[-0.22, 0, 0]}>
        {/* P Stem */}
        <mesh position={[-0.08, 0, 0]}>
          <boxGeometry args={[0.05, 0.32, 0.06]} />
          <meshStandardMaterial {...GOLD_POLISHED} />
        </mesh>
        {/* P Loop Top */}
        <mesh position={[0.02, 0.12, 0]}>
          <boxGeometry args={[0.15, 0.045, 0.06]} />
          <meshStandardMaterial {...GOLD_POLISHED} />
        </mesh>
        {/* P Loop Mid */}
        <mesh position={[0.02, 0.02, 0]}>
          <boxGeometry args={[0.15, 0.045, 0.06]} />
          <meshStandardMaterial {...GOLD_POLISHED} />
        </mesh>
        {/* P Loop Curve Right */}
        <mesh position={[0.08, 0.07, 0]}>
          <boxGeometry args={[0.045, 0.12, 0.06]} />
          <meshStandardMaterial {...GOLD_POLISHED} />
        </mesh>
      </group>

      {/* Letter 'N' */}
      <group position={[0.22, 0, 0]}>
        {/* Left Stem */}
        <mesh position={[-0.09, 0, 0]}>
          <boxGeometry args={[0.05, 0.32, 0.06]} />
          <meshStandardMaterial {...GOLD_POLISHED} />
        </mesh>
        {/* Diagonal Cross */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, -0.58]}>
          <boxGeometry args={[0.045, 0.34, 0.06]} />
          <meshStandardMaterial {...GOLD_POLISHED} />
        </mesh>
        {/* Right Stem */}
        <mesh position={[0.09, 0, 0]}>
          <boxGeometry args={[0.05, 0.32, 0.06]} />
          <meshStandardMaterial {...GOLD_POLISHED} />
        </mesh>
      </group>
    </group>
  )
}

/* ── Central PitchNepal Shield / Medallion ───────────────────── */
function LogoMedallion() {
  const medallionRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (medallionRef.current) {
      medallionRef.current.rotation.y = Math.sin(t * 0.4) * 0.3
      medallionRef.current.rotation.x = Math.cos(t * 0.3) * 0.08
    }
  })

  return (
    <group ref={medallionRef}>
      {/* Outer Golden Bezel Ring */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.5, 0.065, 24, 80]} />
        <meshStandardMaterial {...GOLD_POLISHED} />
      </mesh>

      {/* Secondary Inner Bezel */}
      <mesh position={[0, 0, 0.02]}>
        <torusGeometry args={[1.38, 0.025, 16, 80]} />
        <meshStandardMaterial {...GOLD_DARK} />
      </mesh>

      {/* Dark Obsidian Medallion Core Face */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.42, 1.42, 0.12, 64]} />
        <meshStandardMaterial {...SHIELD_BASE} />
      </mesh>

      {/* Gold Sunburst Rays on Medallion Face */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 12
        return (
          <mesh
            key={`ray-${i}`}
            position={[Math.cos(angle) * 1.15, Math.sin(angle) * 1.15, 0.065]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.18, 0.02, 0.01]} />
            <meshStandardMaterial {...GOLD_POLISHED} />
          </mesh>
        )
      })}

      {/* 3D Stumps on Medallion */}
      <Stumps3D />

      {/* "PN" Monogram on Bottom */}
      <MonogramPN />
    </group>
  )
}

/* ── Gyroscope Orbital Rings ─────────────────────────────────── */
function GyroRings() {
  const ring1 = useRef()
  const ring2 = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ring1.current) {
      ring1.current.rotation.x = t * 0.35
      ring1.current.rotation.y = t * 0.25
    }
    if (ring2.current) {
      ring2.current.rotation.y = -t * 0.3
      ring2.current.rotation.z = t * 0.2
    }
  })

  return (
    <>
      {/* Outer Ring 1 */}
      <group ref={ring1}>
        <mesh>
          <torusGeometry args={[2.05, 0.015, 12, 100]} />
          <meshStandardMaterial color="#ECC84A" metalness={0.95} roughness={0.1} transparent opacity={0.65} />
        </mesh>
        {/* Orbital Node on Ring */}
        <mesh position={[2.05, 0, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial {...GOLD_POLISHED} />
        </mesh>
      </group>

      {/* Outer Ring 2 */}
      <group ref={ring2} rotation={[Math.PI / 3, 0, 0]}>
        <mesh>
          <torusGeometry args={[2.35, 0.012, 12, 100]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.1} transparent opacity={0.45} />
        </mesh>
        {/* Orbital Node on Ring 2 */}
        <mesh position={[-2.35, 0, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial {...GOLD_POLISHED} />
        </mesh>
      </group>
    </>
  )
}

/* ── Gold Particle Dust Field ────────────────────────────────── */
function Particles({ count = 90 }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 1.6 + Math.random() * 2.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [count])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.04
      ref.current.rotation.x = clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.032} color="#ECC84A" transparent opacity={0.7} sizeAttenuation />
    </points>
  )
}

/* ── Studio Lights ───────────────────────────────────────────── */
function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={2.8} color="#FFFFFF" />
      <directionalLight position={[-4, 3, 2]} intensity={1.2} color="#FCE79D" />
      <pointLight position={[0, 3, 3]} intensity={3.0} color="#ECC84A" />
      <pointLight position={[-3, -2, 2]} intensity={1.5} color="#B8860B" />
      <pointLight position={[3, -2, -2]} intensity={1.0} color="#ECC84A" />
      <spotLight position={[0, 8, 2]} angle={0.45} penumbra={0.8} intensity={3.5} color="#FFFFFF" />
    </>
  )
}

/* ── Main Export ─────────────────────────────────────────────── */
export default function PitchNepalLogo3D({ className = '' }) {
  return (
    <div className={`w-full h-full ${className}`} style={{ cursor: 'grab' }}>
      <Canvas
        camera={{ position: [0, 0, 4.4], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <StudioLights />
        <Particles count={90} />
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.35}>
          <LogoMedallion />
        </Float>
        <GyroRings />
        <Stars radius={40} depth={30} count={400} factor={2} saturation={0} fade speed={0.8} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI * 0.70}
          minPolarAngle={Math.PI * 0.30}
        />
      </Canvas>
    </div>
  )
}
