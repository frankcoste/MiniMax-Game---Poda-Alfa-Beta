import React, { useState, useEffect, useMemo } from 'react';

// --- Constantes y Configuración ---
const WIDTH = 1400;
const HEIGHT = 800;
const RADIUS_LEAF = 20;
const TRIANGLE_SIZE = 35;

const COLOR_BG = '#142713';
const COLOR_MAX = '#fde047'; // Amarillo
const COLOR_MIN = '#3b82f6'; // Azul
const COLOR_LEAF_BORDER = '#ef4444'; // Rojo
const COLOR_LINE = '#ffffff';

export default function AlphaBetaGame() {
  const [nodes, setNodes] = useState({});
  const [solution, setSolution] = useState({ states: {}, prunedNodes: new Set(), prunedEdges: new Set() });
  
  const [userInputs, setUserInputs] = useState({});
  const [userPrunedEdges, setUserPrunedEdges] = useState(new Set());
  const [checkMode, setCheckMode] = useState(false);

  // --- Inicialización y Algoritmo ---
  const initGame = () => {
    const newNodes = {};
    const rootId = 'root';
    newNodes[rootId] = { id: rootId, type: 'MAX', x: 700, y: 80, children: [] };
    
    const level1_x = [250, 700, 1150];
    level1_x.forEach((x1, i) => {
      const id1 = `min-${i}`;
      newNodes[id1] = { id: id1, type: 'MIN', x: x1, y: 250, children: [], parentId: rootId };
      newNodes[rootId].children.push(id1);
      
      const level2_x = [x1 - 145, x1, x1 + 145];
      level2_x.forEach((x2, j) => {
        const id2 = `max-${i}-${j}`;
        newNodes[id2] = { id: id2, type: 'MAX', x: x2, y: 450, children: [], parentId: id1 };
        newNodes[id1].children.push(id2);
        
        const level3_x = [x2 - 45, x2, x2 + 45];
        level3_x.forEach((x3, k) => {
          const id3 = `leaf-${i}-${j}-${k}`;
          // Valores aleatorios entre -9 y 15
          const val = Math.floor(Math.random() * 25) - 9;
          newNodes[id3] = { id: id3, type: 'LEAF', x: x3, y: 650, leafValue: val, parentId: id2 };
          newNodes[id2].children.push(id3);
        });
      });
    });

    setNodes(newNodes);
    calculateSolution(newNodes, rootId);
    
    // Resetear interacciones del usuario
    setUserInputs({});
    setUserPrunedEdges(new Set());
    setCheckMode(false);
  };

  const calculateSolution = (treeNodes, rootId) => {
    const states = {};
    const prunedNodes = new Set();
    const prunedEdges = new Set();

    const pruneSubtree = (nodeId) => {
      prunedNodes.add(nodeId);
      const node = treeNodes[nodeId];
      if (node.children) {
        node.children.forEach(childId => {
          prunedEdges.add(`${nodeId}-${childId}`);
          pruneSubtree(childId);
        });
      }
    };

    const alphaBeta = (nodeId, alpha, beta, isMax) => {
      const node = treeNodes[nodeId];
      let finalAlpha = alpha;
      let finalBeta = beta;
      let value = isMax ? -Infinity : Infinity;
      
      if (node.type === 'LEAF') {
        return node.leafValue;
      }

      for (let i = 0; i < node.children.length; i++) {
        const childId = node.children[i];

        // Verificar poda antes de evaluar al hijo
        if (isMax && value >= beta) {
          for (let j = i; j < node.children.length; j++) {
            prunedEdges.add(`${nodeId}-${node.children[j]}`);
            pruneSubtree(node.children[j]);
          }
          break;
        }
        if (!isMax && value <= alpha) {
          for (let j = i; j < node.children.length; j++) {
            prunedEdges.add(`${nodeId}-${node.children[j]}`);
            pruneSubtree(node.children[j]);
          }
          break;
        }

        const childVal = alphaBeta(childId, finalAlpha, finalBeta, !isMax);

        if (isMax) {
          value = Math.max(value, childVal);
          finalAlpha = Math.max(finalAlpha, value);
        } else {
          value = Math.min(value, childVal);
          finalBeta = Math.min(finalBeta, value);
        }
      }

      states[nodeId] = { alpha: finalAlpha, beta: finalBeta, value: value };
      return value;
    };

    alphaBeta(rootId, -Infinity, Infinity, true);
    setSolution({ states, prunedNodes, prunedEdges });
  };

  useEffect(() => {
    initGame();
  }, []);

  // --- Handlers de Usuario ---
  const handleInputChange = (nodeId, field, value) => {
    setUserInputs(prev => ({ ...prev, [`${nodeId}_${field}`]: value }));
    setCheckMode(false);
  };

  const togglePruneEdge = (parentId, childId) => {
    const edgeKey = `${parentId}-${childId}`;
    setUserPrunedEdges(prev => {
      const next = new Set(prev);
      if (next.has(edgeKey)) next.delete(edgeKey);
      else next.add(edgeKey);
      return next;
    });
    setCheckMode(false);
  };

  // --- Validaciones ---
  const parseVal = (str) => {
    if (!str || str.trim() === '') return null;
    const s = str.toLowerCase().trim().replace(/\s+/g, '');
    if (s === 'inf' || s === '+inf' || s === 'infinity' || s === '∞' || s === '+∞') return Infinity;
    if (s === '-inf' || s === '-infinity' || s === '-∞') return -Infinity;
    const n = parseInt(s, 10);
    return isNaN(n) ? null : n;
  };

  const isInputCorrect = (nodeId, field) => {
    if (!checkMode) return null; // null = sin evaluar
    // Si el nodo está podado en la solución, no se le exige rellenar
    if (solution.prunedNodes.has(nodeId)) return true; 

    const userV = parseVal(userInputs[`${nodeId}_${field}`]);
    const correctV = solution.states[nodeId]?.[field];
    
    if (userV === null) return false; // Vacío es incorrecto si no está podado
    return userV === correctV;
  };

  const isEdgePruningCorrect = (edgeKey) => {
    if (!checkMode) return null;
    const shouldBePruned = solution.prunedEdges.has(edgeKey);
    const isUserPruned = userPrunedEdges.has(edgeKey);
    return shouldBePruned === isUserPruned;
  };

  const showSolution = () => {
    const solvedInputs = {};
    Object.keys(nodes).forEach(nodeId => {
      const node = nodes[nodeId];
      if (node.type !== 'LEAF' && !solution.prunedNodes.has(nodeId)) {
        const state = solution.states[nodeId];
        const formatInf = (v) => v === Infinity ? '+inf' : v === -Infinity ? '-inf' : v;
        solvedInputs[`${nodeId}_alpha`] = formatInf(state.alpha);
        solvedInputs[`${nodeId}_beta`] = formatInf(state.beta);
        solvedInputs[`${nodeId}_val`] = formatInf(state.value);
      }
    });
    setUserInputs(solvedInputs);
    setUserPrunedEdges(new Set(solution.prunedEdges));
    setCheckMode(true);
  };

  // --- Renderizado SVG Helpers ---
  const renderTriangle = (node) => {
    const isMax = node.type === 'MAX';
    const s = TRIANGLE_SIZE;
    // MAX: Amarillo apuntando arriba. MIN: Azul apuntando abajo
    const points = isMax 
      ? `0,-${s} -${s},${s} ${s},${s}` 
      : `0,${s} -${s},-${s} ${s},-${s}`;
    
    const fill = isMax ? COLOR_MAX : COLOR_MIN;
    
    return (
      <polygon 
        points={points} 
        fill={fill} 
        stroke="white" 
        strokeWidth="2"
        transform={`translate(${node.x}, ${node.y})`}
      />
    );
  };

  const getInputClass = (isCorrect, isSmall = false) => {
    let base = `bg-black/60 text-white font-mono text-center border-b-2 outline-none focus:bg-black/80 transition-colors ${isSmall ? 'w-8 text-sm' : 'w-10 text-base'}`;
    if (checkMode) {
      if (isCorrect === true) base += ' border-green-500 text-green-300';
      else if (isCorrect === false) base += ' border-red-500 text-red-300';
    } else {
      base += ' border-gray-500 focus:border-white';
    }
    return base;
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans" style={{ backgroundColor: COLOR_BG }}>
      
      {/* Controles Top */}
      <div className="bg-black/40 p-4 rounded-xl shadow-lg border border-white/10 flex flex-wrap gap-4 items-center justify-between w-full max-w-6xl mb-4 text-white">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400">Práctica: Poda Alfa-Beta</h1>
          <p className="text-sm text-gray-300 mt-1">
            Calcula α, β y los valores de los nodos. Haz clic en las líneas para simular la poda. Usa <code className="bg-black/50 px-1 rounded">inf</code> y <code className="bg-black/50 px-1 rounded">-inf</code>.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={initGame} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold transition-colors">
            Generar Nuevo Árbol
          </button>
          <button onClick={() => setCheckMode(true)} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-semibold transition-colors">
            Comprobar Respuestas
          </button>
          <button onClick={showSolution} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold transition-colors">
            Ver Solución
          </button>
        </div>
      </div>

      {/* Contenedor del Árbol Escalonable */}
      <div className="w-full max-w-[1400px] overflow-auto border border-white/10 bg-black/20 rounded-xl relative shadow-2xl">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto min-w-[1000px] select-none">
          
          {/* Dibujar Líneas y Trazos de Poda */}
          {Object.values(nodes).map(node => {
            if (!node.children || node.children.length === 0) return null;
            return node.children.map(childId => {
              const child = nodes[childId];
              const edgeKey = `${node.id}-${childId}`;
              const isPruned = userPrunedEdges.has(edgeKey);
              
              // Calcular coordenadas para el corte rojo
              const midX = (node.x + child.x) / 2;
              const midY = (node.y + child.y) / 2;
              const angle = Math.atan2(child.y - node.y, child.x - node.x);
              const perpAngle = angle + Math.PI / 2;
              const cutLen = 25;
              const cx1 = midX + Math.cos(perpAngle) * cutLen;
              const cy1 = midY + Math.sin(perpAngle) * cutLen;
              const cx2 = midX - Math.cos(perpAngle) * cutLen;
              const cy2 = midY - Math.sin(perpAngle) * cutLen;

              const edgeCorrect = isEdgePruningCorrect(edgeKey);
              let lineColor = COLOR_LINE;
              if (checkMode && isPruned) {
                lineColor = edgeCorrect ? '#22c55e' : '#ef4444'; // Verde si podó bien, Rojo si podó mal
              } else if (checkMode && !isPruned && solution.prunedEdges.has(edgeKey)) {
                // Faltó podar
                lineColor = '#ef4444';
              }

              return (
                <g key={edgeKey}>
                  {/* Línea visible */}
                  <line x1={node.x} y1={node.y} x2={child.x} y2={child.y} stroke={lineColor} strokeWidth="2" opacity={isPruned ? 0.3 : 1} />
                  
                  {/* Línea de corte roja */}
                  {isPruned && (
                     <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke="#ef4444" strokeWidth="4" />
                  )}

                  {/* Línea invisible gruesa para detectar clics */}
                  <line 
                    x1={node.x} y1={node.y} x2={child.x} y2={child.y} 
                    stroke="transparent" strokeWidth="30" 
                    className="cursor-pointer"
                    onClick={() => togglePruneEdge(node.id, childId)}
                  />
                </g>
              );
            });
          })}

          {/* Dibujar Nodos */}
          {Object.values(nodes).map(node => {
            if (node.type === 'LEAF') {
              // Dibujar hoja
              const isPrunedLeaf = userPrunedEdges.has(`${node.parentId}-${node.id}`);
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`} opacity={isPrunedLeaf ? 0.3 : 1}>
                  <circle r={RADIUS_LEAF} fill="white" stroke={COLOR_LEAF_BORDER} strokeWidth="3" />
                  <text textAnchor="middle" dy="5" fontSize="16" fontWeight="bold" fill="black">
                    {node.leafValue}
                  </text>
                </g>
              );
            }

            // Dibujar nodo interno (MAX / MIN)
            const isPrunedNode = node.parentId && userPrunedEdges.has(`${node.parentId}-${node.id}`);
            const inputYOffset = node.type === 'MAX' ? 5 : -15; // Ajustar input dentro del triángulo
            
            return (
              <g key={node.id} opacity={isPrunedNode ? 0.3 : 1}>
                {renderTriangle(node)}
                
                {/* Input de Valor (dentro del triángulo) */}
                <foreignObject x={node.x - 20} y={node.y + inputYOffset - 12} width="40" height="24">
                  <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full flex justify-center items-center">
                    <input 
                      type="text"
                      className={`w-8 h-6 text-center text-sm font-bold bg-transparent border-b outline-none text-black ${checkMode ? (isInputCorrect(node.id, 'val') ? 'border-green-600' : 'border-red-600') : 'border-black/30 placeholder-black/30'}`}
                      value={userInputs[`${node.id}_val`] || ''}
                      onChange={(e) => handleInputChange(node.id, 'val', e.target.value)}
                      placeholder="v"
                    />
                  </div>
                </foreignObject>

                {/* Inputs de Alpha y Beta (al lado del nodo) */}
                <foreignObject x={node.x + 25} y={node.y - 30} width="120" height="60">
                  <div xmlns="http://www.w3.org/1999/xhtml" className="flex flex-col gap-1 text-white text-sm">
                    <div className="flex items-center drop-shadow-md">
                      <span className="w-6 font-serif italic text-yellow-300">α=</span>
                      <input 
                        className={getInputClass(isInputCorrect(node.id, 'alpha'))} 
                        value={userInputs[`${node.id}_alpha`] || ''}
                        onChange={(e) => handleInputChange(node.id, 'alpha', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center drop-shadow-md">
                      <span className="w-6 font-serif italic text-blue-300">β=</span>
                      <input 
                        className={getInputClass(isInputCorrect(node.id, 'beta'))} 
                        value={userInputs[`${node.id}_beta`] || ''}
                        onChange={(e) => handleInputChange(node.id, 'beta', e.target.value)}
                      />
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

    </div>
  );
}