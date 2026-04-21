import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { Sky, ContactShadows } from '@react-three/drei';

export default function Environment() {
  const speed = useStore(state => state.speed);
  const status = useStore(state => state.status);
  const floorRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (status !== 'playing' || !floorRef.current) return;
    
    // Scroll texture simulation for performance
    if (floorRef.current.material) {
        const mat = (Array.isArray(floorRef.current.material) ? floorRef.current.material[0] : floorRef.current.material) as THREE.MeshStandardMaterial;
        if(mat.map) {
            mat.map.offset.y -= speed * delta * 0.1;
        }
    }
  });

  return (
    <group>
      <color attach="background" args={['#050505']} />
      {/* Atmosphere */}
      <Sky distance={450000} sunPosition={[0, 0.2, -1]} inclination={0.5} azimuth={0.25} turbidity={0.1} rayleigh={0.5} />
      <fog attach="fog" args={['#050505', 10, 120]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.15} 
        penumbra={1} 
        intensity={1.5} 
        castShadow 
      />
      
      {/* Realistic Shadowing */}
      <ContactShadows 
        position={[0, -0.49, 0]} 
        opacity={0.7} 
        scale={40} 
        blur={2} 
        far={4} 
        resolution={256} 
        color="#000000" 
      />

      {/* Main Track - Cyberpunk style */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -40]} receiveShadow>
        <planeGeometry args={[100, 400]} />
        <meshPhysicalMaterial 
          color="#050505" 
          roughness={0} 
          metalness={0.9} 
          reflectivity={1}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>
      
      {/* City Walls with Neon accidental lighting */}
      <mesh position={[-8, 5, -40]} receiveShadow>
        <boxGeometry args={[1, 15, 400]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      <mesh position={[8, 5, -40]} receiveShadow>
        <boxGeometry args={[1, 15, 400]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>

      {/* Neon Strips on Walls */}
      <mesh position={[-7.4, 2, -40]}>
        <boxGeometry args={[0.1, 0.2, 400]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>
      <mesh position={[7.4, 2, -40]}>
        <boxGeometry args={[0.1, 0.2, 400]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>

      {/* Railway ties */}
      <Grid speed={speed} status={status} />
    </group>
  );
}

function Grid({ speed, status }: { speed: number, status: string }) {
    const groupRef = useRef<THREE.Group>(null);
    
    useFrame((_, delta) => {
        if(status !== 'playing' || !groupRef.current) return;
        groupRef.current.position.z += speed * delta;
        if(groupRef.current.position.z > 10) {
            groupRef.current.position.z -= 10;
        }
    });
    
    return (
        <group ref={groupRef}>
            {Array.from({ length: 40 }).map((_, i) => (
                <mesh key={i} position={[0, -0.45, -i * 10]} receiveShadow>
                    <boxGeometry args={[12, 0.05, 0.2]} />
                    <meshBasicMaterial color="#00ff00" />
                </mesh>
            ))}
        </group>
    )
}
