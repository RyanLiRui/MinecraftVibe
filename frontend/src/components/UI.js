import React from 'react';

function UI({ gameState }) {
  const blockTypes = ['grass', 'dirt', 'stone', 'wood', 'leaves'];
  
  return (
    <div className="ui-overlay">
      {/* Crosshair */}
      <div className="crosshair" />
      
      {/* Game Info */}
      <div className="game-info">
        <div>Position: ({Math.round(gameState.playerPosition[0])}, {Math.round(gameState.playerPosition[1])}, {Math.round(gameState.playerPosition[2])})</div>
        <div>Selected: {gameState.selectedBlock}</div>
        <div>FPS: {Math.round(1000 / 16)}</div>
      </div>
      
      {/* Controls Info */}
      <div className="controls-info">
        <div><strong>Controls:</strong></div>
        <div>WASD - Move</div>
        <div>Mouse - Look</div>
        <div>Space - Jump</div>
        <div>L-Click - Break</div>
        <div>R-Click - Place</div>
        <div>1-5 - Select Block</div>
        <div>ESC - Exit</div>
      </div>
      
      {/* Inventory Bar */}
      <div className="inventory-bar">
        {blockTypes.map((blockType, index) => (
          <div
            key={blockType}
            className={`inventory-slot ${gameState.selectedBlock === blockType ? 'selected' : ''}`}
          >
            <div style={{ 
              fontSize: '10px', 
              textAlign: 'center',
              textTransform: 'uppercase'
            }}>
              {blockType.slice(0, 3)}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {gameState.inventory[blockType] || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UI;