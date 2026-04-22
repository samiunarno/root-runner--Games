import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { RoundedBox } from '@react-three/drei';
import { LANE_WIDTH, JUMP_VELOCITY, GRAVITY, RUN_SPEED, IDLE_SPEED } from '../constants';
import { JetpackFlame } from './Effects';

export default function Player({ position, playerPosRef, groundHeightRef }: { 
  position: [number, number, number], 
  playerPosRef: React.RefObject<THREE.Vector3>,
  groundHeightRef: React.RefObject<number> 
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const status = useStore(state => state.status);
  const character = useStore(state => state.character);
  const magnetActive = useStore(state => state.powerups.magnet > 0);
  const isJetpackActive = useStore(state => state.powerups.jetpack > 0);
  const updatePowerups = useStore(state => state.updatePowerups);
  
  const [lane, setLane] = useState(0); 
  const [yVelocity, setYVelocity] = useState(0);
  const [isJumping, setIsJumping] = useState(false);

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setLane((l) => Math.max(l - 1, -1));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setLane((l) => Math.min(l + 1, 1));
      } else if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && !isJumping) {
        setYVelocity(JUMP_VELOCITY);
        setIsJumping(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJumping, status]);

  // Handle Touch/Swipe
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart || status !== 'playing') return;
      const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      const dx = touchEnd.x - touchStart.x;
      const dy = touchEnd.y - touchStart.y;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 30) setLane((l) => Math.min(l + 1, 1)); // Right
        if (dx < -30) setLane((l) => Math.max(l - 1, -1)); // Left
      } else {
        // Vertical swipe
        if (dy < -30 && !isJumping) {
          // Up swipe
          setYVelocity(JUMP_VELOCITY);
          setIsJumping(true);
        }
      }
      setTouchStart(null);
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, isJumping, status]);

  // Update physics and lean
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update powerups timer
    updatePowerups(delta);

    // Lateral movement smoothing (lean and x position)
    const targetX = lane * LANE_WIDTH;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 15);
    
    // Lean effect
    const leanAngle = (targetX - groupRef.current.position.x) * -0.2;
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, leanAngle, delta * 10);

    // Jump physics
    let currentGround = groundHeightRef.current || position[1];
    
    // Jetpack priority
    if (isJetpackActive) {
        currentGround = 15; // Fly much higher for sky view
    }

    if (isJumping || isJetpackActive) {
      groupRef.current.position.y += yVelocity * delta;
      
      if (!isJetpackActive) {
        setYVelocity((v) => v + GRAVITY * delta);
      } else {
        // Smooth snap to fly height
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, currentGround, delta * 5);
        setYVelocity(0);
      }

      if (!isJetpackActive && groupRef.current.position.y <= currentGround) {
        groupRef.current.position.y = currentGround;
        setIsJumping(false);
        setYVelocity(0);
      }
    } else {
        // Drop down if ground removed or on top of something
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, currentGround, delta * 15);
    }
    
    // Hover animation idle (only if grounded)
    if (!isJumping && !isJetpackActive && Math.abs(groupRef.current.position.y - currentGround) < 0.1) {
       groupRef.current.position.y = currentGround + Math.sin(state.clock.elapsedTime * 5) * 0.1;
    }

    if (playerPosRef.current) {
       playerPosRef.current.copy(groupRef.current.position);
    }

    // --- PROCEDURAL ANIMATIONS ---
    const time = state.clock.elapsedTime;
    
    if (isJumping) {
      // JUMPING ANIMATION
      // Pull arms up
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI / 2.5, delta * 10);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI / 2.5, delta * 10);
      // Tuck legs
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -Math.PI / 4, delta * 10);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -Math.PI / 4, delta * 10);
      // Lean forward
      if (bodyRef.current) bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0.2, delta * 10);
    } 
    else if (status === 'playing') {
      // RUNNING (SURFING) ANIMATION
      const runCycle = Math.sin(time * RUN_SPEED);
      
      if (character === 'nerd') {
        // FUNNY RUNNING
        if (leftArmRef.current) leftArmRef.current.rotation.x = runCycle * 1.5; // Exaggerated
        if (rightArmRef.current) rightArmRef.current.rotation.x = -runCycle * 1.5;
        if (leftLegRef.current) leftLegRef.current.rotation.x = -runCycle * 1.2;
        if (rightLegRef.current) rightLegRef.current.rotation.x = runCycle * 1.2;
        
        if (bodyRef.current) {
          bodyRef.current.position.y = 1.1 + Math.abs(runCycle) * 0.2; // Extra bob
          bodyRef.current.rotation.y = runCycle * 0.1; // Funny wiggle
        }
      } else {
        // Arms swing
        if (leftArmRef.current) leftArmRef.current.rotation.x = runCycle * 0.3;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -runCycle * 0.3;
        
        // Legs subtle movement
        if (leftLegRef.current) leftLegRef.current.rotation.x = -runCycle * 0.1;
        if (rightLegRef.current) rightLegRef.current.rotation.x = runCycle * 0.1;
        
        // Body bob
        if (bodyRef.current) {
          bodyRef.current.position.y = 1.1 + Math.abs(runCycle) * 0.05;
          bodyRef.current.rotation.x = 0.15 + Math.sin(time * 5) * 0.05; // Leaning into the surf
        }
      }
      
      // Head bob
      if (headRef.current) headRef.current.rotation.x = -0.1 + Math.sin(time * 5) * 0.02;
    } 
    else {
      // IDLE ANIMATION
      const idleCycle = Math.sin(time * IDLE_SPEED);
      
      // Breathing effect
      if (bodyRef.current) bodyRef.current.position.y = 1.1 + idleCycle * 0.02;
      
      // Subtle head movement
      if (headRef.current) headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      
      // Reset limbs
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.1, delta * 5);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0.1, delta * 5);
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, delta * 5);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, delta * 5);
      if (bodyRef.current) bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, delta * 5);
    }
  });

  // Reusable Limb Component
  const Limb = ({ position, args, color, refProp, rotation = [0, 0, 0] as [number, number, number] }) => (
    <group position={position} rotation={rotation} ref={refProp}>
      <RoundedBox args={args as [number, number, number]} radius={0.05} position={[0, -args[1] / 2, 0]}>
        <meshPhysicalMaterial color={color} roughness={0.7} />
      </RoundedBox>
    </group>
  );

  return (
    <group ref={groupRef} position={position}>
      {/* Neon Hoverboard with Physical properties */}
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <RoundedBox args={[1.1, 0.15, 2.2]} radius={0.05} smoothness={4}>
          <meshPhysicalMaterial 
            color="#111" 
            emissive="#00ffcc" 
            emissiveIntensity={1} 
            roughness={0.1} 
            metalness={0.9} 
            clearcoat={1}
          />
        </RoundedBox>
      </mesh>

      {/* Powerup Visuals: Jetpack */}
      {isJetpackActive && (
        <group position={[0, 1.2, -0.4]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.7, 0.3]} />
            <meshPhysicalMaterial color="#39ff14" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Thrusters */}
          <group position={[-0.3, -0.4, 0]}>
             <mesh>
               <cylinderGeometry args={[0.1, 0.15, 0.3]} />
               <meshBasicMaterial color="#00ffff" />
             </mesh>
             <pointLight intensity={1} color="#00ffff" distance={2} />
             <JetpackFlame active={isJetpackActive} />
          </group>
          <group position={[0.3, -0.4, 0]}>
             <mesh>
               <cylinderGeometry args={[0.1, 0.15, 0.3]} />
               <meshBasicMaterial color="#00ffff" />
             </mesh>
             <pointLight intensity={1} color="#00ffff" distance={2} />
             <JetpackFlame active={isJetpackActive} />
          </group>
        </group>
      )}

      {/* Magnet Aura */}
      {magnetActive && (
        <mesh position={[0, 1, 0]} rotation={[Math.PI/2, 0, 0]}>
           <torusGeometry args={[1.5, 0.05, 16, 32]} />
           <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
        </mesh>
      )}

      <group ref={bodyRef}>
        {character === 'boy' ? (
          <group>
            {/* Body (Green Hoodie) */}
            <RoundedBox args={[0.8, 1.0, 0.6]} radius={0.1} position={[0, 1.1, 0]} castShadow>
              <meshPhysicalMaterial color="#22cc88" roughness={0.7} metalness={0.1} />
            </RoundedBox>
            
            {/* Limbs */}
            <Limb refProp={leftArmRef} position={[-0.5, 1.5, 0]} args={[0.2, 0.6, 0.2]} color="#22cc88" />
            <Limb refProp={rightArmRef} position={[0.5, 1.5, 0]} args={[0.2, 0.6, 0.2]} color="#22cc88" />
            <Limb refProp={leftLegRef} position={[-0.25, 0.6, 0]} args={[0.3, 0.6, 0.3]} color="#3366ff" />
            <Limb refProp={rightLegRef} position={[0.25, 0.6, 0]} args={[0.3, 0.6, 0.3]} color="#3366ff" />

            {/* Head */}
            <group position={[0, 2, 0]} ref={headRef}>
              <RoundedBox args={[0.7, 0.7, 0.7]} radius={0.2} castShadow>
                <meshPhysicalMaterial color="#ffccaa" roughness={0.3} />
              </RoundedBox>
              {/* Backward Cap */}
              <mesh position={[0, 0.3, -0.2]} castShadow>
                <boxGeometry args={[0.7, 0.2, 0.9]} />
                <meshPhysicalMaterial color="#333" roughness={0.9} />
              </mesh>
            </group>
          </group>
        ) : character === 'girl' ? (
          <group>
            {/* Body (Leather Jacket) */}
            <RoundedBox args={[0.75, 1.0, 0.55]} radius={0.1} position={[0, 1.1, 0]} castShadow>
              <meshPhysicalMaterial color="#111" roughness={0.1} metalness={0.5} clearcoat={1} />
            </RoundedBox>

            {/* Limbs */}
            <Limb refProp={leftArmRef} position={[-0.45, 1.5, 0]} args={[0.18, 0.6, 0.18]} color="#111" />
            <Limb refProp={rightArmRef} position={[0.45, 1.5, 0]} args={[0.18, 0.6, 0.18]} color="#111" />
            <Limb refProp={leftLegRef} position={[-0.22, 0.6, 0]} args={[0.25, 0.6, 0.25]} color="#77aaff" />
            <Limb refProp={rightLegRef} position={[0.22, 0.6, 0]} args={[0.25, 0.6, 0.25]} color="#77aaff" />

            {/* Head */}
            <group position={[0, 2, 0]} ref={headRef}>
              <RoundedBox args={[0.65, 0.65, 0.65]} radius={0.2} castShadow>
                <meshPhysicalMaterial color="#ffccaa" roughness={0.3} />
              </RoundedBox>
              {/* Pink Hair */}
              <mesh position={[0, 0.3, -0.1]} castShadow>
                <boxGeometry args={[0.8, 0.4, 0.8]} />
                <meshPhysicalMaterial color="#ff66b2" roughness={0.2} clearcoat={0.5} />
              </mesh>
            </group>
          </group>
        ) : character === 'bot' ? (
          <group>
            {/* Robot Body (Copper/Metallic) */}
            <RoundedBox args={[0.8, 1.2, 0.7]} radius={0.05} position={[0, 1.1, 0]} castShadow>
              <meshPhysicalMaterial color="#cd7f32" metalness={1} roughness={0.2} />
            </RoundedBox>
            <Limb refProp={leftArmRef} position={[-0.5, 1.6, 0]} args={[0.2, 0.7, 0.2]} color="#b87333" />
            <Limb refProp={rightArmRef} position={[0.5, 1.6, 0]} args={[0.2, 0.7, 0.2]} color="#b87333" />
            <Limb refProp={leftLegRef} position={[-0.3, 0.6, 0]} args={[0.3, 0.6, 0.3]} color="#555" />
            <Limb refProp={rightLegRef} position={[0.3, 0.6, 0]} args={[0.3, 0.6, 0.3]} color="#555" />
            <group position={[0, 2.1, 0]} ref={headRef}>
              <RoundedBox args={[0.7, 0.6, 0.7]} radius={0.1} castShadow>
                <meshPhysicalMaterial color="#cd7f32" metalness={1} roughness={0.2} />
              </RoundedBox>
              <mesh position={[0, 0, 0.36]}>
                 <boxGeometry args={[0.4, 0.1, 0.05]} />
                 <meshBasicMaterial color="#00ffff" />
              </mesh>
            </group>
          </group>
        ) : character === 'glitch' ? (
          <group>
            {/* Hacker/Glitch (Shadow/Matrix) */}
            <RoundedBox args={[0.75, 1.1, 0.55]} radius={0.1} position={[0, 1.1, 0]} castShadow>
              <meshPhysicalMaterial color="#000" emissive="#00ff00" emissiveIntensity={0.2} roughness={0} />
            </RoundedBox>
            <Limb refProp={leftArmRef} position={[-0.45, 1.5, 0]} args={[0.18, 0.6, 0.18]} color="#000" />
            <Limb refProp={rightArmRef} position={[0.45, 1.5, 0]} args={[0.18, 0.6, 0.18]} color="#000" />
            <Limb refProp={leftLegRef} position={[-0.22, 0.6, 0]} args={[0.25, 0.6, 0.25]} color="#000" />
            <Limb refProp={rightLegRef} position={[0.22, 0.6, 0]} args={[0.25, 0.6, 0.25]} color="#000" />
            <group position={[0, 2, 0]} ref={headRef}>
              <RoundedBox args={[0.65, 0.65, 0.65]} radius={0.1} castShadow>
                <meshPhysicalMaterial color="#050505" />
              </RoundedBox>
              <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[0.7, 0.1, 0.7]} />
                <meshPhysicalMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
              </mesh>
            </group>
          </group>
        ) : character === 'nexus' ? (
          <group>
            {/* Cloud/Nexus (Holographic/Blue) */}
            <RoundedBox args={[0.8, 1.1, 0.6]} radius={0.2} position={[0, 1.1, 0]}>
              <meshPhysicalMaterial color="#00aaff" transparent opacity={0.6} transmission={0.9} thickness={0.5} />
            </RoundedBox>
            <Limb refProp={leftArmRef} position={[-0.5, 1.5, 0]} args={[0.2, 0.6, 0.2]} color="#00ccff" />
            <Limb refProp={rightArmRef} position={[0.5, 1.5, 0]} args={[0.2, 0.6, 0.2]} color="#00ccff" />
            <Limb refProp={leftLegRef} position={[-0.25, 0.6, 0]} args={[0.3, 0.6, 0.3]} color="#00ccff" />
            <Limb refProp={rightLegRef} position={[0.25, 0.6, 0]} args={[0.3, 0.6, 0.3]} color="#00ccff" />
            <group position={[0, 2, 0]} ref={headRef}>
              <mesh castShadow>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
              </mesh>
              <pointLight color="#00aaff" intensity={2} distance={3} />
            </group>
          </group>
        ) : (
          <group>
            {/* Default/Nerd Character */}
            <RoundedBox args={[0.7, 1.1, 0.5]} radius={0.1} position={[0, 1.1, 0]} castShadow>
              <meshPhysicalMaterial color="#ffffff" roughness={0.5} />
            </RoundedBox>
            {/* Bowtie */}
            <mesh position={[0, 1.4, 0.3]} castShadow>
               <boxGeometry args={[0.3, 0.15, 0.1]} />
               <meshPhysicalMaterial color="#ff0000" />
            </mesh>
            
            {/* Limbs */}
            <Limb refProp={leftArmRef} position={[-0.4, 1.5, 0]} args={[0.15, 0.8, 0.15]} color="#ffffff" />
            <Limb refProp={rightArmRef} position={[0.4, 1.5, 0]} args={[0.15, 0.8, 0.15]} color="#ffffff" />
            
            <group ref={leftLegRef} position={[-0.2, 0.6, 0]}>
                 <RoundedBox args={[0.2, 0.8, 0.2]} radius={0.05} position={[0, -0.4, 0]} castShadow>
                    <meshPhysicalMaterial color="#444" roughness={0.8} />
                 </RoundedBox>
                 <mesh position={[0, -0.85, 0.1]} castShadow>
                    <boxGeometry args={[0.25, 0.2, 0.4]} />
                    <meshPhysicalMaterial color="#111" />
                 </mesh>
            </group>
            
            <group ref={rightLegRef} position={[0.2, 0.6, 0]}>
                 <RoundedBox args={[0.2, 0.8, 0.2]} radius={0.05} position={[0, -0.4, 0]} castShadow>
                    <meshPhysicalMaterial color="#444" roughness={0.8} />
                 </RoundedBox>
                 <mesh position={[0, -0.85, 0.1]} castShadow>
                    <boxGeometry args={[0.25, 0.2, 0.4]} />
                    <meshPhysicalMaterial color="#111" />
                 </mesh>
            </group>

            {/* Head */}
            <group position={[0, 2, 0]} ref={headRef}>
              <RoundedBox args={[0.6, 0.6, 0.6]} radius={0.2} castShadow>
                <meshPhysicalMaterial color="#ffccaa" roughness={0.3} />
              </RoundedBox>
              {/* Giant Glasses */}
              <group position={[0, 0, 0.32]}>
                 <mesh position={[-0.18, 0, 0]}>
                    <torusGeometry args={[0.15, 0.03, 8, 16]} />
                    <meshPhysicalMaterial color="#000000" />
                 </mesh>
                 <mesh position={[0.18, 0, 0]}>
                    <torusGeometry args={[0.15, 0.03, 8, 16]} />
                    <meshPhysicalMaterial color="#000000" />
                 </mesh>
                 <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[0.2, 0.03, 0.03]} />
                    <meshPhysicalMaterial color="#000000" />
                 </mesh>
              </group>
            </group>
          </group>
        )}
      </group>
    </group>
  );
}
