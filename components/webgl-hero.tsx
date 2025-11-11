"use client"

import { useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import * as THREE from "three"

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false })
const OrbitControls = dynamic(() => import("@react-three/drei").then((m) => m.OrbitControls), { ssr: false })

function FloatingNotebook() {
  const meshRef = useRef<any>(null)

  useEffect(() => {
    if (!meshRef.current) return

    let animationId: number
    const animate = () => {
      if (meshRef.current) {
        meshRef.current.rotation.x += 0.001
        meshRef.current.rotation.z += 0.0015
        meshRef.current.position.y += Math.sin(Date.now() * 0.001) * 0.0005
      }
      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[2, 3, 0.2]} />
      <meshStandardMaterial
        color="#508080"
        metalness={0.5}
        roughness={0.3}
        emissive="#2a5f5f"
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

function FloatingCard() {
  const meshRef = useRef<any>(null)

  useEffect(() => {
    if (!meshRef.current) return

    let animationId: number
    const animate = () => {
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.008
        meshRef.current.position.y = Math.sin(Date.now() * 0.0008) * 1.5
      }
      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <mesh ref={meshRef} position={[3, 0, 0]}>
      <boxGeometry args={[1, 1.5, 0.1]} />
      <meshStandardMaterial
        color="#d97706"
        metalness={0.4}
        roughness={0.4}
        emissive="#b45309"
        emissiveIntensity={0.2}
      />
    </mesh>
  )
}

function ProgressOrb() {
  const meshRef = useRef<any>(null)

  useEffect(() => {
    if (!meshRef.current) return

    let animationId: number
    const animate = () => {
      if (meshRef.current) {
        meshRef.current.rotation.x += 0.003
        meshRef.current.rotation.y += 0.005
      }
      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <mesh ref={meshRef} position={[-3, 0.5, 0]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color="#508080"
        wireframe={false}
        emissive="#2a5f5f"
        emissiveIntensity={0.4}
        metalness={0.6}
        roughness={0.2}
      />
    </mesh>
  )
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)
  const positionAttributeRef = useRef<THREE.BufferAttribute | null>(null)

  useEffect(() => {
    if (!pointsRef.current) return

    const count = 100
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20
      positions[i + 1] = (Math.random() - 0.5) * 20
      positions[i + 2] = (Math.random() - 0.5) * 20
    }

    const geometry = new THREE.BufferGeometry()
    const positionAttribute = new THREE.BufferAttribute(positions, 3)
    geometry.setAttribute("position", positionAttribute)
    pointsRef.current.geometry = geometry
    positionAttributeRef.current = positionAttribute

    let animationId: number
    const animate = () => {
      if (!positionAttributeRef.current) return

      const positions = positionAttributeRef.current.array as Float32Array

      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.01
        if (positions[i] > 10) {
          positions[i] = -10
        }
      }
      positionAttributeRef.current.needsUpdate = true

      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <points ref={pointsRef} position={[0, 0, -5]}>
      <pointsMaterial color="#508080" size={0.1} sizeAttenuation />
    </points>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#508080" />
      <pointLight position={[0, 0, -10]} intensity={0.3} color="#d97706" />

      <FloatingNotebook />
      <FloatingCard />
      <ProgressOrb />
      <ParticleField />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI * 0.6}
      />
    </>
  )
}

export default function WebGLHero() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-gradient-to-b from-background to-muted overflow-hidden"
    >
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          style={{ background: "transparent" }}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Fallback for devices without WebGL */}
      <noscript>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-foreground">3D visualization not available</p>
          </div>
        </div>
      </noscript>
    </div>
  )
}
