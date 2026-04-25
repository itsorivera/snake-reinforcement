import React, { useEffect, useRef, useState } from 'react';
import * as ort from 'onnxruntime-web';
import { SnakeGame } from './SnakeGame';
import './App.css';
import { Activity, RotateCcw, Brain, Shield, Info } from 'lucide-react';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game] = useState(new SnakeGame());
  const [session, setSession] = useState<ort.InferenceSession | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [status, setStatus] = useState('Cargando Cerebro Artificial...');

  // Cargar el modelo ONNX al inicio
  useEffect(() => {
    async function loadModel() {
      try {
        // Estabilidad: Usar versión 1.19.0 (muy recomendada en foros de ONNX)
        ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/';
        ort.env.wasm.numThreads = 1; // Evitar fallos de hilos en algunos navegadores
        
        // Buscamos el modelo en el folder public (se sirve en la raíz)
        const sess = await ort.InferenceSession.create('/models/snake_model.onnx', {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all'
        });
        setSession(sess);
        setIsModelLoaded(true);
        setStatus('Modelo DQN (PPO) Listo');
      } catch (e) {
        console.error(e);
        setStatus('Error al cargar modelo. ¿Ejecutaste el script de exportación?');
      }
    }
    loadModel();
  }, []);

  // Bucle de renderizado e inferencia
  useEffect(() => {
    if (!isModelLoaded || !session) return;

    const interval = setInterval(async () => {
      if (game.isGameOver) {
        setHighScore(prev => Math.max(prev, game.score));
        game.reset();
        return;
      }

      // 1. Obtener observación del estado actual
      const obs = game.getObservation();
      const inputTensor = new ort.Tensor('float32', new Float32Array(obs), [1, 11]);

      // 2. Inferencia: El modelo decide el movimiento
      try {
        const outputs = await session.run({ input: inputTensor });
        const outputData = outputs.output.data as Float32Array;
        
        // El modelo exportado devuelve logits por cada acción (0-3)
        // Seleccionamos el índice con el valor más alto (Argmax)
        let action = 0;
        let maxVal = -Infinity;
        for (let i = 0; i < outputData.length; i++) {
          if (outputData[i] > maxVal) {
            maxVal = outputData[i];
            action = i;
          }
        }
        
        // 3. Ejecutar acción en el juego
        game.step(action);
        setScore(game.score);
        render();
      } catch (e) {
        console.error("Inference error:", e);
      }
    }, 100); // 10 FPS para que sea visible

    return () => clearInterval(interval);
  }, [isModelLoaded, session, game]);

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid sutil
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Comida
    ctx.fillStyle = '#ff4d4d';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff4d4d';
    ctx.fillRect(game.food.x * 20 + 2, game.food.y * 20 + 2, 16, 16);
    ctx.shadowBlur = 0;

    // Serpiente
    game.snake.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? '#00ff42' : '#22c55e';
      ctx.fillRect(segment.x * 20 + 1, segment.y * 20 + 1, 18, 18);
    });
  };

  return (
    <div className="dashboard">
      <main className="game-container">
        <header className="game-header">
          <div className="status-badge">
            <Activity className="icon-pulse" size={16} />
            <span>{status}</span>
          </div>
          <h1 className="title">Snake RL Agent</h1>
        </header>
        
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={400} 
          className="game-canvas"
        />

        <div className="controls">
          <button className="btn-primary" onClick={() => game.reset()}>
            <RotateCcw size={18} /> Reset Agent
          </button>
        </div>
      </main>

      <aside className="stats-panel">
        <div className="card">
          <div className="card-header">
            <Brain size={20} className="text-primary" />
            <h3>Agente Inteligente</h3>
          </div>
          <p className="card-desc">Red Neuronal: PPO (Proximal Policy Optimization)</p>
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Puntuación</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Récord</span>
              <span className="stat-value text-primary">{highScore}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <Shield size={20} />
            <h3>MLOps Pipeline</h3>
          </div>
          <ul className="pipeline-list">
            <li className="done">Modeling (Python/SB3)</li>
            <li className="done">Training (uv/PPO)</li>
            <li className="done">Export (ONNX)</li>
            <li className="active">Deployment (Edge/WASM)</li>
          </ul>
        </div>

        <div className="info-card">
          <Info size={20} />
          <p>La serpiente está siendo controlada por una red neuronal ejecutándose directamente en tu navegador (WASM).</p>
        </div>
      </aside>
    </div>
  );
};

export default App;
