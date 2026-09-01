// src/components/three/CricketBall3D.jsx
// Compact 3D cricket ball for product cards and decorative use

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'

function Ball({ speed = 1 }) {
  const groupRef = useRef()
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * speed * 0.8
      groupRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3
    }
  })
  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#8B1A1A"
          metalness={0.2}
          roughness={0.75}
        />
      </mesh>
      {/* Seam horizontal */}
      <mesh>
        <torusGeometry args={[1.0, 0.045, 8, 80, Math.PI * 2]} />
        <meshStandardMaterial color="#C9A227" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Seam vertical */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.045, 8, 80, Math.PI * 2]} />
        <meshStandardMaterial color="#C9A227" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

export default function CricketBall3D({ size = 120, speed = 1, className = '' }) {
  return (
    <div style={{ width: size, height: size }} className={className}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={2} color="#ffffff" />
        <pointLight position={[-2, -2, 2]} intensity={1} color="#C9A227" />
        <Float speed={speed * 1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <Ball speed={speed} />
        </Float>
      </Canvas>
    </div>
  )
}
