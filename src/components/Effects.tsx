import { useFrame } from '@react-three/fiber';
import { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { Trail } from '@react-three/drei';

// --- PARTICLE BURST ---
interface Particle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export function ParticleSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useRef<Particle[]>([]);
  const nextId = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const handleBurst = (e: any) => {
      const { x, y, z, count, color, speed, size } = e.detail;
      for (let i = 0; i < count; i++) {
        particles.current.push({
          id: nextId.current++,
          position: new THREE.Vector3(x, y, z),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * speed,
            (Math.random() - 0.5) * (speed * 0.5) + (speed * 0.5), // Upward tendency
            (Math.random() - 0.5) * speed
          ),
          life: 1,
          maxLife: 0.3 + Math.random() * 0.4,
          color: color || '#ffffff',
          size: size || 0.1
        });
      }
    };

    window.addEventListener('game_effect_burst', handleBurst);
    return () => window.removeEventListener('game_effect_burst', handleBurst);
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    particles.current = particles.current.filter(p => {
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.life -= delta / p.maxLife;
      return p.life > 0;
    });

    const count = particles.current.length;
    meshRef.current.count = count;

    particles.current.forEach((p, i) => {
      dummy.position.copy(p.position);
      dummy.scale.setScalar(p.size * p.life);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
      meshRef.current?.setColorAt(i, new THREE.Color(p.color));
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null!, null!, 1000]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent />
    </instancedMesh>
  );
}

// --- PLAYER TRAIL ---
export function PlayerTrail({ playerPosRef }: { playerPosRef: React.RefObject<THREE.Vector3> }) {
  const status = useStore(state => state.status);

  return (
    <group>
      {status === 'playing' && playerPosRef.current && (
        <Trail
          width={1.5}
          length={8}
          color={'#00ffcc'}
          attenuation={(t) => t * t}
        >
          <mesh position={[0, -0.1, 0]}>
            <sphereGeometry args={[0.1]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </Trail>
      )}
    </group>
  );
}

// Helper to trigger effects
export const triggerBurst = (config: { x: number, y: number, z: number, count: number, color?: string, speed?: number, size?: number }) => {
  window.dispatchEvent(new CustomEvent('game_effect_burst', { detail: config }));
};

export function JetpackFlame({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useRef<{ position: THREE.Vector3, velocity: THREE.Vector3, life: number, size: number }[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (active) {
      // Spawn new flame particles
      for (let i = 0; i < 3; i++) {
        particles.current.push({
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            0,
            (Math.random() - 0.5) * 0.1
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            -2 - Math.random() * 3,
            (Math.random() - 0.5) * 0.5
          ),
          life: 1.0,
          size: 0.1 + Math.random() * 0.1
        });
      }
    }

    particles.current = particles.current.filter(p => {
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.life -= delta * 2;
      return p.life > 0;
    });

    meshRef.current.count = particles.current.length;
    particles.current.forEach((p, i) => {
      dummy.position.copy(p.position);
      dummy.scale.setScalar(p.size * p.life);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
      
      // Color transition from blue to orange to smoke
      const color = new THREE.Color();
      if (p.life > 0.7) color.set('#00ffff');
      else if (p.life > 0.3) color.set('#ffaa00');
      else color.set('#444444');
      meshRef.current?.setColorAt(i, color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null!, null!, 200]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.8} />
    </instancedMesh>
  );
}
