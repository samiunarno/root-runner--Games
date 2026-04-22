import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import Player from './Player';
import Environment from './Environment';
import Spawner from './Obstacles';
import { ParticleSystem, PlayerTrail } from './Effects';
import { useStore } from '../store/useStore';
import { EffectComposer, Bloom, Vignette, BrightnessContrast } from '@react-three/postprocessing';
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
        <CameraController status={status} playerPosRef={playerPosRef} />
        <Environment />
        <Player position={[0, 0, 0]} playerPosRef={playerPosRef} groundHeightRef={groundHeightRef} />
        <Spawner playerPosRef={playerPosRef} groundHeightRef={groundHeightRef} />
        
        {/* Visual Effects */}
        <ParticleSystem />
        <PlayerTrail playerPosRef={playerPosRef} />
        
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

function CameraController({ status, playerPosRef }: { status: string, playerPosRef: React.RefObject<THREE.Vector3> }) {
  const currentFocus = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (status !== 'playing' || !playerPosRef.current) return;

    const px = playerPosRef.current.x;
    const py = playerPosRef.current.y;
    const pz = playerPosRef.current.z;

    const isHigh = py > 10;
    
    // Dynamic offsets based on altitude (jetpack)
    const offsetZ = isHigh ? 16 : 9;
    const offsetY = isHigh ? 10 : 4.5;
    const lerpSpeed = isHigh ? 3 : 5; // Responsive speed
    const focusLerpSpeed = isHigh ? 2 : 6;

    // Smoothed target position
    const tx = px * 0.3; // Less lateral movement for camera
    const ty = py + offsetY;
    const tz = pz + offsetZ;

    const f = 1 - Math.exp(-lerpSpeed * delta);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, tx, f);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, ty, f * 0.5); // Y should be slightly more damped for stairs/ramps
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, tz, f);

    // Dynamic focus point (look ahead)
    const fx = px;
    const fy = py + (isHigh ? -4 : 1.2);
    const fz = pz - 15; // Focus further ahead for speed feeling

    const ff = 1 - Math.exp(-focusLerpSpeed * delta);
    currentFocus.current.x = THREE.MathUtils.lerp(currentFocus.current.x, fx, ff);
    currentFocus.current.y = THREE.MathUtils.lerp(currentFocus.current.y, fy, ff);
    currentFocus.current.z = THREE.MathUtils.lerp(currentFocus.current.z, fz, ff);

    state.camera.lookAt(currentFocus.current);

    // Add cinematic roll based on lateral movement
    const targetRoll = (px - state.camera.position.x) * -0.05;
    state.camera.rotation.z = THREE.MathUtils.lerp(state.camera.rotation.z, targetRoll, ff);

    // Dynamic FOV based on speed/altitude
    const targetFOV = isHigh ? 65 : 55;
    if (state.camera instanceof THREE.PerspectiveCamera) {
      state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFOV, f);
      state.camera.updateProjectionMatrix();
    }
  });

  return null;
}
