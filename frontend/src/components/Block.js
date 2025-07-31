import React, { useRef, useEffect } from 'react';
import { Box } from '@react-three/cannon';
import * as THREE from 'three';

// Enhanced block materials with better stylized look
const createBlockMaterial = (type) => {
  const materials = {
    grass: new THREE.MeshLambertMaterial({ 
      color: new THREE.Color('#4CAF50'),
      transparent: false,
      roughness: 0.8,
      metalness: 0.1
    }),
    dirt: new THREE.MeshLambertMaterial({ 
      color: new THREE.Color('#8B4513'),
      transparent: false,
      roughness: 0.9,
      metalness: 0.0
    }),
    stone: new THREE.MeshLambertMaterial({ 
      color: new THREE.Color('#708090'),
      transparent: false,
      roughness: 0.7,
      metalness: 0.2
    }),
    wood: new THREE.MeshLambertMaterial({ 
      color: new THREE.Color('#DEB887'),
      transparent: false,
      roughness: 0.8,
      metalness: 0.0
    }),
    leaves: new THREE.MeshLambertMaterial({ 
      color: new THREE.Color('#228B22'),
      transparent: true,
      opacity: 0.8,
      roughness: 0.9,
      metalness: 0.0
    })
  };
  
  return materials[type] || materials.stone;
};

// Add subtle edge highlighting for stylized look
const createBlockGeometry = () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  
  // Add subtle bevel for stylized appearance
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  
  return geometry;
};

function Block({ position, type, onRef }) {
  const meshRef = useRef();
  const material = createBlockMaterial(type);
  const geometry = createBlockGeometry();
  
  // Physics body for collision
  const [ref, api] = Box(() => ({
    position: position,
    mass: 0, // Static blocks
    material: { friction: 0.9, restitution: 0.1 }
  }));
  
  useEffect(() => {
    if (meshRef.current && onRef) {
      onRef(meshRef.current);
    }
    
    return () => {
      if (onRef) {
        onRef(null);
      }
    };
  }, [onRef]);
  
  // Update physics position when position prop changes
  useEffect(() => {
    api.position.set(...position);
  }, [position, api]);

  return (
    <mesh 
      ref={(mesh) => {
        meshRef.current = mesh;
        ref.current = mesh;
      }}
      position={position}
      castShadow
      receiveShadow
      geometry={geometry}
      material={material}
    >
      {/* Add subtle outline for stylized look */}
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial 
          color={type === 'leaves' ? '#1a5c1a' : '#000000'} 
          transparent 
          opacity={type === 'leaves' ? 0.3 : 0.1}
          linewidth={1}
        />
      </lineSegments>
    </mesh>
  );
}

export default Block;