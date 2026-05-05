# Snake Reinforcement Learning

This project demonstrates a **MLOps** pipeline for training and deploying a Reinforcement Learning (RL) agent.

![Snake Game](/assets/ai-snake.png)

## System Architecture

The project is divided into two ecosystems to simulate a real-world industry workflow:

### 1. Modeling & Training (`/modeling`)

- **Environment:** Custom `Gymnasium` (OpenAI Gym) implementation for Snake.
- **Algorithm:** **PPO (Proximal Policy Optimization)** using `Stable Baselines 3`.
- **Management:** `uv` (Rust-based Python package manager) for maximum speed and reproducibility.
- **Pipeline:** Training in Python → Export to **ONNX** for interoperability.

### 2. Web Deployment (`/webapp`)

- **Edge Inference:** Real-time model execution using `ONNX Runtime Web` (WASM).
- **Frontend:** React + TypeScript + Vite.
- **Dashboard:** Visualization of inference metrics and agent state.

## Tech Stack

- **ML:** Python, Gymnasium, Stable Baselines 3, PyTorch.
- **DevOps/MLOps:** `uv`, ONNX, Model Exportation Pipeline.
- **Frontend:** React 18, TypeScript, TailwindCSS (custom styles), Lucide Icons.

## Engineering Decisions

1.  **Hybrid Approach:** Instead of training in the browser (slow and unstable), we train in Python (research standard) and deploy on the web (product standard).
2.  **Observation Vector:** Design of an 11-dimensional state space including proximity sensors and relative food direction, optimizing model convergence.
3.  **WASM vs Server-side:** The model runs 100% on the client side. This reduces latency to <1ms and eliminates server costs for inference.

---

## Local Execution

### Requirements

- Python 3.11+ (with `uv`)
- Node.js 18+

### Training

```bash
cd modeling
uv run python train.py
uv run python export_onnx.py
```

### Frontend

```bash
cd webapp
npm install
npm run dev
```
