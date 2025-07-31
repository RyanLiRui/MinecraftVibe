import React, { useMemo, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { usePlane } from '@react-three/cannon';
import * as THREE from 'three';
import Block from './Block';

// Simple world generation
const generateTerrain = (size = 32, height = 8) => {
  const blocks = [];
  const halfSize = size / 2;
  
  for (let x = -halfSize; x < halfSize; x++) {
    for (let z = -halfSize; z < halfSize; z++) {
      // Simple height variation using sin/cos for stylized terrain
      const baseHeight = Math.floor(
        height / 2 + 
        Math.sin(x * 0.1) * 3 + 
        Math.cos(z * 0.1) * 2 + 
        Math.sin(x * 0.05 + z * 0.05) * 4
      );
      
      // Generate terrain layers
      for (let y = 0; y <= baseHeight; y++) {
        let blockType = 'stone';
        
        if (y === baseHeight) {
          blockType = 'grass';
        } else if (y >= baseHeight - 2) {
          blockType = 'dirt';
        }
        
        // Add some variety
        if (Math.random() < 0.05 && y === baseHeight && blockType === 'grass') {
          // Occasionally place a different block
          blockType = Math.random() < 0.5 ? 'wood' : 'leaves';
        }
        
        blocks.push({
          position: [x, y, z],
          type: blockType,
          id: `${x}-${y}-${z}`
        });
      }
    }
  }
  
  return blocks;
};

// Block materials with stylized colors
const blockMaterials = {
  grass: new THREE.MeshLambertMaterial({ 
    color: '#4CAF50',
    transparent: false
  }),
  dirt: new THREE.MeshLambertMaterial({ 
    color: '#8B4513',
    transparent: false 
  }),
  stone: new THREE.MeshLambertMaterial({ 
    color: '#808080',
    transparent: false 
  }),
  wood: new THREE.MeshLambertMaterial({ 
    color: '#8B4513',
    transparent: false 
  }),
  leaves: new THREE.MeshLambertMaterial({ 
    color: '#228B22',
    transparent: false 
  })
};

function GameWorld({ gameState, setGameState }) {
  const { camera } = useThree();
  const worldRef = useRef();
  const blocksRef = useRef(new Map());
  
  // Generate initial terrain
  const initialBlocks = useMemo(() => generateTerrain(24, 6), []);
  const [blocks, setBlocks] = React.useState(initialBlocks);
  
  // Ground plane for physics
  const [groundRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -1, 0],
    material: { friction: 0.9, restitution: 0.1 }
  }));

  // Handle block interactions
  const handleBlockInteraction = React.useCallback((position, type) => {
    if (type === 'break') {
      // Remove block
      setBlocks(prev => prev.filter(block => 
        !(block.position[0] === position[0] && 
          block.position[1] === position[1] && 
          block.position[2] === position[2])
      ));
      
      // Add to inventory (simplified)
      setGameState(prev => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          [gameState.selectedBlock]: (prev.inventory[gameState.selectedBlock] || 0) + 1
        }
      }));
    } else if (type === 'place') {
      // Place block
      const newBlock = {
        position: position,
        type: gameState.selectedBlock,
        id: `${position[0]}-${position[1]}-${position[2]}`
      };
      
      setBlocks(prev => [...prev, newBlock]);
      
      // Remove from inventory
      setGameState(prev => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          [gameState.selectedBlock]: Math.max(0, (prev.inventory[gameState.selectedBlock] || 0) - 1)
        }
      }));
    }
  }, [gameState.selectedBlock, setGameState]);

  // Mouse controls for block interaction
  useEffect(() => {
    const handleMouseDown = (event) => {
      if (!gameState.isPlaying) return;
      
      event.preventDefault();
      
      // Raycasting for block selection
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(0, 0); // Center of screen
      
      // Get camera from the scene
      const camera = worldRef.current?.parent?.parent?.children?.find(child => child.isCamera);
      if (!camera) return;
      
      raycaster.setFromCamera(mouse, camera);
      
      // Get all block meshes
      const blockMeshes = Array.from(blocksRef.current.values()).filter(mesh => mesh && mesh.visible);
      const intersects = raycaster.intersectObjects(blockMeshes);
      
      if (intersects.length > 0) {
        const intersectedBlock = intersects[0];
        const blockPosition = [
          Math.round(intersectedBlock.object.position.x),
          Math.round(intersectedBlock.object.position.y),
          Math.round(intersectedBlock.object.position.z)
        ];
        
        if (event.button === 0) { // Left click - break
          handleBlockInteraction(blockPosition, 'break');
        } else if (event.button === 2) { // Right click - place
          // Calculate placement position based on face normal
          const face = intersectedBlock.face;
          const placePosition = [
            blockPosition[0] + (face.normal.x > 0 ? 1 : face.normal.x < 0 ? -1 : 0),
            blockPosition[1] + (face.normal.y > 0 ? 1 : face.normal.y < 0 ? -1 : 0),
            blockPosition[2] + (face.normal.z > 0 ? 1 : face.normal.z < 0 ? -1 : 0)
          ];
          
          // Check if position is not occupied
          const isOccupied = blocks.some(block => 
            block.position[0] === placePosition[0] &&
            block.position[1] === placePosition[1] &&
            block.position[2] === placePosition[2]
          );
          
          if (!isOccupied && (gameState.inventory[gameState.selectedBlock] || 0) > 0) {
            handleBlockInteraction(placePosition, 'place');
          }
        }
      }
    };
    
    const handleContextMenu = (event) => {
      event.preventDefault();
    };
    
    if (gameState.isPlaying) {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('contextmenu', handleContextMenu);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gameState.isPlaying, blocks, gameState.selectedBlock, gameState.inventory]);

  return (
    <group ref={worldRef}>
      {/* Invisible ground plane for physics */}
      <mesh ref={groundRef} visible={false}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Render all blocks */}
      {blocks.map((block) => (
        <Block
          key={block.id}
          position={block.position}
          type={block.type}
          material={blockMaterials[block.type]}
          onRef={(mesh) => {
            if (mesh) {
              blocksRef.current.set(block.id, mesh);
            } else {
              blocksRef.current.delete(block.id);
            }
          }}
        />
      ))}
      
      {/* Stylized sky elements */}
      <mesh position={[0, 80, 0]} scale={[200, 200, 200]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#87CEEB" 
          side={THREE.BackSide}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

export default GameWorld;