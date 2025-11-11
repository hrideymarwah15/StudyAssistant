"use client"

// This component ensures Three.js is properly available globally for WebGL components
import * as THREE from "three"

declare global {
  var ThreeJS: typeof THREE
}

if (typeof window !== "undefined") {
  ;(window as any).ThreeJS = THREE
}

export default function ThreeSetup() {
  return null
}
