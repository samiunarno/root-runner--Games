import { Canvas } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import Player from './Player';
import Environment from './Environment';
import Spawner from './Obstacles';
import { useStore } from '../store/useStore';
import { EffectComposer, Bloom, Vignette, BrightnessContrast, ToneMapping } from '@react-three/postprocessing';
import { Environment as EnvironmentPreset, Stars } from '@react-three/drei';

export default function Game() {
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const groundHeightRef = useRef(0);
  const increaseSpeed = useStore(state => state.increaseSpeed);
  const status = useStore(state => state.status);
  const addScore = useStore(state => state.addScore);
  
  // Game loop interval for distance scoring & speed
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'playing') {
      interval = setInterval(() => {
        addScore(1); // passive distance score
        increaseSpeed(); // slowly increase speed
      }, 500);
    }
    return () => clearInterval(interval);
  }, [status, addScore, increaseSpeed]);

  return (
    <div className="w-full h-full absolute inset-0 bg-gray-900">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [0, 4, 10], fov: 50 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          stencil: false, 
          depth: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0
        }}
      >
        <CameraController status={status} />
        <Environment />
        <Player position={[0, 0, 0]} playerPosRef={playerPosRef} groundHeightRef={groundHeightRef} />
        <Spawner playerPosRef={playerPosRef} groundHeightRef={groundHeightRef} />
        
        {/* Realistic touches */}
        <EnvironmentPreset preset="city" />
        <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        {/* Post-processing */}
        <EffectComposer multisampling={4}>
          <Bloom 
            intensity={0.5} 
            luminanceThreshold={0.8} 
            luminanceSmoothing={0.1} 
            mipmapBlur 
          />
          <BrightnessContrast brightness={0} contrast={0.1} />
          <Vignette eskil={false} offset={0.2} darkness={0.8} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

function CameraController({ status }: { status: string }) {
   // Optional: animate camera on game over or menu
   return null;
}
