"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function MouseParallax({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!group.current) return;
    const x = (state.pointer.x * viewport.width) / 2;
    const y = (state.pointer.y * viewport.height) / 2;
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      x * 0.08,
      0.04
    );
    group.current.position.y = THREE.MathUtils.lerp(
      group.current.position.y,
      y * 0.06,
      0.04
    );
  });

  return <group ref={group}>{children}</group>;
}

function FloatingCard({
  position,
  rotation,
  scale = 1,
  color = "#12151F",
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.6}>
      <group position={position} rotation={rotation} scale={scale}>
        <RoundedBox args={[1.6, 1.05, 0.06]} radius={0.08} smoothness={4}>
          <meshStandardMaterial
            color={color}
            metalness={0.2}
            roughness={0.45}
            transparent
            opacity={0.92}
          />
        </RoundedBox>
        <mesh position={[-0.25, 0.22, 0.04]}>
          <planeGeometry args={[0.7, 0.08]} />
          <meshBasicMaterial color="#5B6AF0" transparent opacity={0.7} />
        </mesh>
        <mesh position={[-0.1, 0.05, 0.04]}>
          <planeGeometry args={[1.0, 0.05]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
        </mesh>
        <mesh position={[-0.2, -0.1, 0.04]}>
          <planeGeometry args={[0.8, 0.05]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
        </mesh>
        <mesh position={[0.45, -0.28, 0.04]}>
          <circleGeometry args={[0.12, 24]} />
          <meshBasicMaterial color="#5B6AF0" transparent opacity={0.85} />
        </mesh>
      </group>
    </Float>
  );
}

function MessageBubble({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.8}>
      <group position={position} scale={scale}>
        <RoundedBox args={[1.1, 0.55, 0.05]} radius={0.12} smoothness={4}>
          <meshStandardMaterial
            color="#5B6AF0"
            metalness={0.15}
            roughness={0.4}
            emissive="#5B6AF0"
            emissiveIntensity={0.15}
          />
        </RoundedBox>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.7, 0.08]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
        </mesh>
      </group>
    </Float>
  );
}

function GlowOrb({
  position,
  scale,
}: {
  position: [number, number, number];
  scale: number;
}) {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#5B6AF0" transparent opacity={0.06} />
    </mesh>
  );
}

function Particles({ count = 50 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#8B9AFF"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function AmbientCanvas() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 7], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 5]} intensity={0.9} />
        <pointLight position={[-3, 2, 4]} intensity={0.5} color="#5B6AF0" />

        <MouseParallax>
          <FloatingCard
            position={[2.8, 1.1, -0.5]}
            rotation={[-0.15, -0.35, 0.1]}
            scale={1.05}
          />
          <FloatingCard
            position={[-3.1, -0.6, -1]}
            rotation={[0.2, 0.4, -0.08]}
            scale={0.85}
            color="#0E111A"
          />
          <MessageBubble position={[2.2, -1.3, 0.3]} scale={0.9} />
          <MessageBubble position={[-2.4, 1.4, 0]} scale={0.7} />
          <GlowOrb position={[3.5, 0.5, -2]} scale={1.8} />
          <GlowOrb position={[-3.2, -1.2, -2.5]} scale={2.2} />
        </MouseParallax>

        <Particles count={55} />
      </Canvas>
    </div>
  );
}
