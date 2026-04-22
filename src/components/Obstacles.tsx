import { useFrame } from '@react-three/fiber';
import { useRef, useState, useMemo, useEffect } from 'react';
import { io } from 'socket.io-client';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { Text } from '@react-three/drei';
import { LANE_WIDTH, SPAWN_Z } from '../constants';
import { triggerBurst } from './Effects';

const OBSTACLE_TYPES = ['barrier', 'tall', 'train', 'cone', 'turret', 'slider', 'ramp'];
const POWERUP_TYPES = ['jetpack', 'sneakers', 'magnet', 'multiplier'];
const SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'C++', 'Java', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby',
  'Data Structures', 'Algorithms', 'Operating Systems', 'Computer Networks', 'Database Management', 'SQL', 'NoSQL', 'MongoDB',
  'Machine Learning', 'Artificial Intelligence', 'Deep Learning', 'Neural Networks', 'Natural Language Processing',
  'Cloud Computing', 'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions',
  'Cybersecurity', 'Ethical Hacking', 'Cryptography', 'Blockchain', 'Web3', 'Smart Contracts',
  'Mobile Development', 'Flutter', 'React Native', 'Android SDK', 'iOS Development',
  'UI/UX Design', 'Figma', 'System Design', 'Microservices', 'Distributed Systems',
  'Compilers', 'Discrete Math', 'Calculus', 'Linear Algebra', 'Statistics',
  'Embedded Systems', 'IoT', 'Quantum Computing', 'Game Development', 'Unity', 'Unreal Engine'
];

interface Item {
  id: number;
  type: 'obstacle' | 'skill' | 'powerup' | 'projectile';
  lane: number;
  z: number;
  subType?: string;
  isMoving?: boolean; 
  isSliding?: boolean;
  slideDir?: number;
  skillName?: string;
  projectileSpeed?: number;
  y?: number; // Added for ramp logic
}

export default function Spawner({ playerPosRef, groundHeightRef }: { 
  playerPosRef: React.RefObject<THREE.Vector3>,
  groundHeightRef: React.RefObject<number> 
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [popups, setPopups] = useState<{ id: number, text: string, x: number, z: number, opacity: number }[]>([]);
  
  // Store refs directly to avoid re-renders of this component
  const speedRef = useRef(15);
  const statusRef = useRef<'menu' | 'playing' | 'paused' | 'gameover' | 'shop'>('menu');
  
  // Select values but don't cause re-renders for every frame if possible
  const status = useStore(state => state.status);
  const speed = useStore(state => state.speed);
  const gameSettings = useStore(state => state.gameSettings);
  const addScore = useStore(state => state.addScore);
  const addSkills = useStore(state => state.addSkills);
  const endGame = useStore(state => state.endGame);
  const activatePowerup = useStore(state => state.activatePowerup);
  const magnetActive = useStore(state => state.powerups.magnet > 0);
  const isJetpackActive = useStore(state => state.powerups.jetpack > 0);

  useEffect(() => { 
    speedRef.current = speed; 
  }, [speed]);

  useEffect(() => { statusRef.current = status as any; }, [status]);

  const lastSpawnZ = useRef(0);
  const idCounter = useRef(0);
  const popupIdCounter = useRef(0);

  // We'll manage the items' Z positions in a ref map to avoid state updates every frame
  const itemZMap = useRef<Map<number, number>>(new Map());

  // Core Game Loop
  useFrame((_, delta) => {
    const curSpeed = speedRef.current;

    if (statusRef.current !== 'playing') {
       if (items.length > 0) {
         setItems([]);
         setPopups([]);
         itemZMap.current.clear();
         lastSpawnZ.current = 0;
       }
       return;
    }
    
    // 1. Spawning
    lastSpawnZ.current += curSpeed * delta;
    
    // Obstacle spawn distance depends on speed and global spawnRate
    const spawnThreshold = 18 / (gameSettings.spawnRate || 1.0);
    
    if (lastSpawnZ.current > spawnThreshold) {
      lastSpawnZ.current = 0;
      const newItems: Item[] = [];
      const numLanes = Math.random() > 0.8 ? 2 : 1;
      const occupied = new Set();
      for(let i=0; i<numLanes; i++) {
          let lane = Math.floor(Math.random() * 3) - 1;
          while(occupied.has(lane)) lane = Math.floor(Math.random() * 3) - 1;
          occupied.add(lane);
          
          const rand = Math.random();
          if (rand > 0.88) {
             const id = idCounter.current++;
             const subType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
             newItems.push({ id, type: 'powerup', lane, z: SPAWN_Z, subType });
             itemZMap.current.set(id, SPAWN_Z);
          } else if (rand > 0.5) {
             const skillName = SKILLS[Math.floor(Math.random() * SKILLS.length)];
             for(let j=0; j<5; j++) {
                 const id = idCounter.current++;
                 newItems.push({ id, type: 'skill', lane, z: SPAWN_Z - j * 2, skillName });
                 itemZMap.current.set(id, SPAWN_Z - j * 2);
             }
          } else {
              const subType = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
              const id = idCounter.current++;
              newItems.push({ 
                id, type: 'obstacle', lane, z: SPAWN_Z, subType, 
                isMoving: subType === 'train' && Math.random() > 0.6,
                isSliding: subType === 'slider',
                slideDir: Math.random() > 0.5 ? 1 : -1
              });
              itemZMap.current.set(id, SPAWN_Z);
          }
      }
      setItems(prev => [...prev, ...newItems]);
    }

    // 2. Collision Detection & Z Updating
    // We update the itemZMap and check collisions.
    // If an item is hit or goes off-screen, we mark it for removal from items state.
    if (playerPosRef.current) {
        const px = playerPosRef.current.x;
        const py = playerPosRef.current.y;
        const pz = playerPosRef.current.z;

        let itemsToRemove: number[] = [];
        let projectilesToFire: Item[] = [];
        let scoreVal = 0;
        let skillCount = 0;
        let popupsBatch: typeof popups = [];
        let crash = false;
        let newGroundHeight = 0;

        for(const item of items) {
            let z = itemZMap.current.get(item.id) || item.z;
            let moveSpeed = curSpeed;
            if (item.isMoving) moveSpeed += 25;
            if (item.type === 'projectile') moveSpeed = item.projectileSpeed || 40;
            
            z += moveSpeed * delta;
            let itemLane = item.lane;

            // Magnet Attraction
            if (item.type === 'skill' && magnetActive && z > -20 && z < 5) {
                const targetLane = px / LANE_WIDTH;
                item.lane = THREE.MathUtils.lerp(item.lane, targetLane, delta * 12);
                itemLane = item.lane;
            }

            itemZMap.current.set(item.id, z);

            if (z > 10) {
                itemsToRemove.push(item.id);
                continue;
            }

            const itemX = itemLane * LANE_WIDTH;
            const dx = Math.abs(px - itemX);
            const dz = Math.abs(pz - z);

            // Ground height detection
            if (item.subType === 'train') {
               if (dx < 0.9 && dz < 6) newGroundHeight = 4;
            } else if (item.subType === 'ramp') {
               if (dx < 0.9 && dz < 4.0) {
                   const rampProgress = (z - pz + 4.0) / 8;
                   newGroundHeight = Math.max(0, Math.min(4, rampProgress * 4));
               }
            }

            // Projectile firing - Reduced rate and speed
            if (item.subType === 'turret' && z < -40 && z > -45 && Math.random() > 0.992) {
                const pid = idCounter.current++;
                projectilesToFire.push({ id: pid, type: 'projectile', lane: item.lane, z, projectileSpeed: 30 });
                itemZMap.current.set(pid, z);
            }

            // Collision logic
            if (item.type === 'skill') {
                if (dx < 1.1 && dz < 1.1 && py < (newGroundHeight + 2.2)) {
                    itemsToRemove.push(item.id);
                    scoreVal += 20;
                    skillCount += 1;
                    popupsBatch.push({ id: popupIdCounter.current++, text: item.skillName || 'Skill++', x: itemX, z, opacity: 1 });
                    triggerBurst({ x: itemX, y: py, z: z, count: 15, color: '#00ff00', speed: 10 });
                }
            } else if (item.type === 'powerup') {
                if (dx < 1.1 && dz < 1.1 && py < (newGroundHeight + 2.2)) {
                   itemsToRemove.push(item.id);
                   scoreVal += 100;
                   const sType = item.subType as any;
                   if (['magnet', 'multiplier', 'jetpack'].includes(sType)) activatePowerup(sType, 10);
                   popupsBatch.push({ id: popupIdCounter.current++, text: sType.toUpperCase(), x: itemX, z, opacity: 1 });
                   triggerBurst({ x: itemX, y: py, z: z, count: 30, color: '#ffff00', speed: 15, size: 0.2 });
                }
            } else if (item.type === 'obstacle' || item.type === 'projectile') {
                let hit = false;
                if (item.type === 'projectile') { if (dx < 0.3 && dz < 0.6 && py < 1.5) hit = true; }
                else if (item.subType === 'barrier') { if (dx < 0.6 && dz < 0.5 && py < 1.3) hit = true; }
                else if (item.subType === 'tall') { if (dx < 0.5 && dz < 0.5 && py < 1.8) hit = true; }
                else if (item.subType === 'cone') { if (dx < 0.5 && dz < 0.5 && py < 0.8) hit = true; }
                else if (item.subType === 'train') { 
                    const playerTop = py + 1.2;
                    if (playerTop > 3.9 && dx < 0.9 && dz < 5.2) hit = false; // Safe on top
                    else if (dx < 0.75 && dz < 4.2 && py < 3.2) hit = true; 
                }
                else if (item.subType === 'turret') { if (dx < 0.7 && dz < 1.0 && py < 3.0) hit = true; }
                else if (item.subType === 'slider') { if (dx < 0.6 && dz < 0.5 && py < 1.3) hit = true; }
                
                if (hit) {
                    crash = true;
                    triggerBurst({ x: px, y: py, z: pz, count: 50, color: '#ff0000', speed: 20, size: 0.3 });
                }
            }
        }

        if (itemsToRemove.length > 0 || projectilesToFire.length > 0) {
            setItems(prev => {
               const filtered = prev.filter(p => !itemsToRemove.includes(p.id));
               return [...filtered, ...projectilesToFire];
            });
            // Cleanup zMap
            itemsToRemove.forEach(id => itemZMap.current.delete(id));
        }

        if (scoreVal > 0) addScore(scoreVal);
        if (skillCount > 0) addSkills(skillCount);
        if (popupsBatch.length > 0) setPopups(p => [...p, ...popupsBatch]);
        
        groundHeightRef.current = newGroundHeight;

        if (crash) endGame();
    }

    // Update Popups
    setPopups((prev) => {
        if (prev.length === 0) return prev;
        return prev
            .map(p => ({ ...p, z: p.z + curSpeed * delta, opacity: p.opacity - delta * 0.8 }))
            .filter(p => p.opacity > 0);
    });
  });

  return (
    <>
      {items.map(item => (
        <ItemRenderer key={item.id} item={item} zMap={itemZMap} />
      ))}
      {popups.map(popup => (
        <SkillPopup key={popup.id} popup={popup} />
      ))}
    </>
  );
}

function SkillPopup({ popup }: { popup: { text: string, x: number, z: number, opacity: number } }) {
  // Use useMemo for text properties to avoid re-renders
  return (
    <group position={[popup.x, 2 + (1 - popup.opacity), popup.z]}>
      <Text
        fontSize={0.5}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
        fillOpacity={popup.opacity}
      >
        {popup.text}
      </Text>
    </group>
  );
}

function ItemRenderer({ item, zMap }: { item: Item, zMap: React.RefObject<Map<number, number>> }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
      if (!groupRef.current) return;
      
      const x = item.lane * LANE_WIDTH;
      // Update position from shared Z map
      const z = zMap.current?.get(item.id) ?? item.z;
      groupRef.current.position.set(x, groupRef.current.position.y, z);

      if(item.type === 'skill') {
          // Inner group rotation for skill
          const innerGroup = groupRef.current.children[0];
          if (innerGroup) {
            innerGroup.rotation.y += 0.1;
            innerGroup.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 6) * 0.15;
          }
      } else if(item.type === 'powerup') {
          const innerGroup = groupRef.current.children[0];
          if (innerGroup) {
            innerGroup.rotation.y += 0.02;
            innerGroup.position.y = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
          }
      }
  });

  return (
    <group ref={groupRef} position={[item.lane * LANE_WIDTH, 0, item.z]}>
      {/* Skill Collectible */}
      {item.type === 'skill' && (
        <group position={[0, 0.5, 0]}>
          <mesh castShadow receiveShadow>
            <torusGeometry args={[0.4, 0.1, 16, 32]} />
            <meshPhysicalMaterial 
              color="#00ff00" 
              emissive="#00ff00"
              emissiveIntensity={1}
              metalness={0.5} 
              roughness={0.1} 
            />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
             <boxGeometry args={[0.3, 0.3, 0.3]} />
             <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* Powerup */}
      {item.type === 'powerup' && (
        <group position={[0, 1, 0]}>
          {item.subType === 'jetpack' ? (
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.6, 1, 0.4]} />
              <meshPhysicalMaterial color="#39ff14" emissive="#11cc00" emissiveIntensity={1} metalness={0.8} roughness={0.2} />
            </mesh>
          ) : item.subType === 'magnet' ? (
            <group rotation={[Math.PI / 2, 0, 0]}>
               <mesh castShadow>
                 <torusGeometry args={[0.3, 0.1, 16, 24, Math.PI]} />
                 <meshPhysicalMaterial color="#ff0000" metalness={0.8} />
               </mesh>
               <mesh position={[-0.3, -0.15, 0]}>
                  <boxGeometry args={[0.2, 0.3, 0.2]} />
                  <meshPhysicalMaterial color="#ffffff" />
               </mesh>
               <mesh position={[0.3, -0.15, 0]}>
                  <boxGeometry args={[0.2, 0.3, 0.2]} />
                  <meshPhysicalMaterial color="#ffffff" />
               </mesh>
            </group>
          ) : item.subType === 'multiplier' ? (
            <group>
               <mesh castShadow rotation={[Math.PI/2, 0, 0]}>
                  <cylinderGeometry args={[0.4, 0.4, 0.15, 16]} />
                  <meshPhysicalMaterial color="#ffd700" metalness={1} roughness={0.1} />
               </mesh>
               <Text position={[0,0,0.1]} fontSize={0.4} color="#000">2X</Text>
            </group>
          ) : (
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.4, 0.3, 0.6]} />
              <meshPhysicalMaterial color="#ff00ff" emissive="#ff00aa" emissiveIntensity={0.5} metalness={0.5} roughness={0.1} />
            </mesh>
          )}
        </group>
      )}

      {/* Projectiles */}
      {item.type === 'projectile' && (
        <group position={[0, 1, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.2, 1, 4, 8]} />
            <meshPhysicalMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} metalness={0.5} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Obstacles Variants */}
      {item.type === 'obstacle' && (
        <>
          {item.subType === 'slider' && (
            <group position={[0, 0.4, 0]}>
               <mesh castShadow receiveShadow>
                  <boxGeometry args={[1.5, 0.8, 1.5]} />
                  <meshPhysicalMaterial color="#ff00ff" roughness={0.2} metalness={0.8} />
               </mesh>
               <mesh position={[0, 0.5, 0]}>
                  <boxGeometry args={[1.6, 0.2, 1.6]} />
                  <meshPhysicalMaterial color="#333" />
               </mesh>
            </group>
          )}
          {item.subType === 'turret' && (
            <group position={[0, 1.5, 0]}>
               <mesh castShadow receiveShadow>
                  <boxGeometry args={[1, 3, 1]} />
                  <meshPhysicalMaterial color="#222" metalness={0.9} roughness={0.1} />
               </mesh>
               <mesh position={[0, 1.2, 0]}>
                  <sphereGeometry args={[0.4, 16, 16]} />
                  <meshBasicMaterial color="#ff0000" />
               </mesh>
               <mesh position={[0, -1.4, 0]}>
                  <boxGeometry args={[1.5, 0.2, 1.5]} />
                  <meshPhysicalMaterial color="#111" />
               </mesh>
            </group>
          )}
          {item.subType === 'barrier' && (
            <group position={[0, 0.5, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1.8, 1, 0.2]} />
                <meshPhysicalMaterial color="#ffcc00" roughness={0.3} metalness={0.5} />
              </mesh>
            </group>
          )}
          {item.subType === 'tall' && (
            <group position={[0, 1.5, 0]}>
              <mesh position={[-0.8, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 3, 0.2]} />
                <meshPhysicalMaterial color="#888888" metalness={0.9} roughness={0.1} />
              </mesh>
              <mesh position={[0.8, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 3, 0.2]} />
                <meshPhysicalMaterial color="#888888" metalness={0.9} roughness={0.1} />
              </mesh>
              <mesh position={[0, 0, 0]} receiveShadow>
                <boxGeometry args={[1.6, 2.8, 0.05]} />
                <meshPhysicalMaterial color="#aaaaaa" transparent opacity={0.4} wireframe />
              </mesh>
            </group>
          )}
          {item.subType === 'cone' && (
            <group position={[0, 0.6, 0]}>
              <mesh castShadow receiveShadow>
                <coneGeometry args={[0.4, 1.2, 16]} />
                <meshPhysicalMaterial color="#ff6600" emissive="#cc4400" emissiveIntensity={0.2} roughness={0.4} />
              </mesh>
            </group>
          )}
          {item.subType === 'ramp' && (
            <group position={[0, 0, 0]}>
               <mesh rotation={[-Math.PI / 6, 0, 0]} position={[0, 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[1.8, 0.2, 8]} />
                  <meshPhysicalMaterial color="#555" roughness={1} />
               </mesh>
               <mesh position={[0, 1, 1]} receiveShadow>
                  <boxGeometry args={[1.7, 2, 6]} />
                  <meshPhysicalMaterial color="#222" />
               </mesh>
            </group>
          )}
          {item.subType === 'train' && (
            <group position={[0, 2, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1.8, 4, 10]} />
                <meshPhysicalMaterial color="#3388ff" metalness={0.9} roughness={0.1} reflectivity={1} clearcoat={1} />
              </mesh>
            </group>
          )}
        </>
      )}
    </group>
  );
}
