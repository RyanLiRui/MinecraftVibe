import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';

const MOVEMENT_SPEED = 10;
const JUMP_FORCE = 15;
const MOUSE_SENSITIVITY = 0.002;

function Player({ gameState, setGameState }) {
  const { camera } = useThree();
  const keysRef = useRef({});
  const mouseRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef([0, 0, 0]);
  const canJumpRef = useRef(false);
  
  // Physics body for player collision
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position: gameState.playerPosition,
    fixedRotation: true,
    material: { friction: 0.1, restitution: 0.1 },
    args: [0.5] // Player radius
  }));
  
  // Track velocity for jump detection
  useEffect(() => {
    const unsubscribe = api.velocity.subscribe((velocity) => {
      velocityRef.current = velocity;
      canJumpRef.current = Math.abs(velocity[1]) < 0.5; // Can jump when vertical velocity is low
    });
    
    return unsubscribe;
  }, [api]);
  
  // Update player position in game state
  useEffect(() => {
    const unsubscribe = api.position.subscribe((position) => {
      setGameState(prev => ({
        ...prev,
        playerPosition: position
      }));
    });
    
    return unsubscribe;
  }, [api, setGameState]);
  
// Remove debug console.log statements now that we've fixed the main issue
  // Set up controls
  useEffect(() => {
    const handleKeyDown = (event) => {
      keysRef.current[event.code] = true;
    };
    
    const handleKeyUp = (event) => {
      keysRef.current[event.code] = false;
    };
    
    const handleMouseMove = (event) => {
      if (!gameState.isPlaying) return;
      
      mouseRef.current.x += event.movementX * MOUSE_SENSITIVITY;
      mouseRef.current.y += event.movementY * MOUSE_SENSITIVITY;
      
      // Clamp vertical rotation
      mouseRef.current.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseRef.current.y));
    };
    
    if (gameState.isPlaying) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      document.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState.isPlaying]);
  
  // Handle number key selection for inventory
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.code;
      
      // Block selection (1-9 keys)
      if (key >= 'Digit1' && key <= 'Digit9') {
        const blockTypes = ['grass', 'dirt', 'stone', 'wood', 'leaves'];
        const index = parseInt(key.replace('Digit', '')) - 1;
        if (index < blockTypes.length) {
          setGameState(prev => ({
            ...prev,
            selectedBlock: blockTypes[index]
          }));
        }
      }
    };
    
    if (gameState.isPlaying) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.isPlaying, setGameState]);

  // Game loop - handle movement and camera
  useFrame((state, delta) => {
    if (!gameState.isPlaying) return;
    
    // Update camera rotation based on mouse movement
    camera.rotation.order = 'YXZ';
    camera.rotation.y = -mouseRef.current.x;
    camera.rotation.x = -mouseRef.current.y;
    
    // Calculate movement direction based on camera rotation
    const direction = new THREE.Vector3();
    const velocity = [0, velocityRef.current[1], 0]; // Preserve vertical velocity
    
    // WASD movement
    if (keysRef.current['KeyW']) {
      direction.z -= 1;
    }
    if (keysRef.current['KeyS']) {
      direction.z += 1;
    }
    if (keysRef.current['KeyA']) {
      direction.x -= 1;
    }
    if (keysRef.current['KeyD']) {
      direction.x += 1;
    }
    
    // Normalize and apply camera rotation
    if (direction.length() > 0) {
      direction.normalize();
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
      
      velocity[0] = direction.x * MOVEMENT_SPEED;
      velocity[2] = direction.z * MOVEMENT_SPEED;
    }
    
    // Jumping
    if (keysRef.current['Space'] && canJumpRef.current) {
      velocity[1] = JUMP_FORCE;
      canJumpRef.current = false;
    }
    
    // Apply movement
    api.velocity.set(velocity[0], velocity[1], velocity[2]);
    
    // Update camera position to follow player
    if (ref.current) {
      camera.position.copy(ref.current.position);
      camera.position.y += 0.8; // Eye height
    }
    
    // Apply air resistance for smoother movement
    api.velocity.set(
      velocity[0] * 0.95,
      velocity[1],
      velocity[2] * 0.95
    );
  });
  
  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[0.5]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export default Player;