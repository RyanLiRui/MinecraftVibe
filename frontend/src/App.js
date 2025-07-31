import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import GameWorld from './components/GameWorld';
import Player from './components/Player';
import UI from './components/UI';
import './App.css';

function App() {
  const [gameState, setGameState] = useState({
    isPlaying: false,
    playerPosition: [0, 10, 0],
    inventory: {},
    selectedBlock: 'grass'
  });

  const canvasRef = useRef();

  // Handle pointer lock for first-person controls
  useEffect(() => {
    const handleClick = () => {
      if (!gameState.isPlaying) {
        canvasRef.current?.requestPointerLock();
      }
    };

    const handlePointerLockChange = () => {
      setGameState(prev => ({
        ...prev,
        isPlaying: document.pointerLockElement === canvasRef.current
      }));
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [gameState.isPlaying]);

  return (
    <div className="app">
      {!gameState.isPlaying && (
        <div className="start-screen">
          <h1>Minecraft Three.js</h1>
          <p>Click to start playing</p>
          <div className="controls">
            <p><strong>Controls:</strong></p>
            <p>WASD - Move</p>
            <p>Mouse - Look around</p>
            <p>Space - Jump</p>
            <p>Left Click - Break blocks</p>
            <p>Right Click - Place blocks</p>
            <p>ESC - Exit pointer lock</p>
          </div>
        </div>
      )}

      <Canvas
        ref={canvasRef}
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        style={{ height: '100vh', width: '100vw' }}
        shadows
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
      >
        {/* Enhanced lighting setup for stylized look */}
        <fog attach="fog" args={['#87CEEB', 50, 200]} />
        
        {/* Main directional light (sun) */}
        <directionalLight
          position={[50, 100, 50]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={200}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          color="#FFF8DC"
        />
        
        {/* Ambient light for overall scene illumination */}
        <ambientLight intensity={0.4} color="#87CEEB" />
        
        {/* Hemisphere light for natural sky lighting */}
        <hemisphereLight
          skyColor="#87CEEB"
          groundColor="#8B4513"
          intensity={0.6}
        />

        <Physics gravity={[0, -30, 0]} iterations={15}>
          <GameWorld gameState={gameState} setGameState={setGameState} />
          {gameState.isPlaying && (
            <Player gameState={gameState} setGameState={setGameState} />
          )}
        </Physics>
      </Canvas>

      {gameState.isPlaying && <UI gameState={gameState} />}
    </div>
  );
}

export default App;