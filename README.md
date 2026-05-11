# Snake Reinforcement Learning

This project demonstrates a professional **MLOps** pipeline for training and deploying a Reinforcement Learning (RL) agent.

![Snake Game](/assets/ai-snake.png)

## System Architecture

The project is divided into two ecosystems to simulate a real-world industry workflow:

### 1. Modeling & Training (`/modeling`)

- **Environment:** Custom `Gymnasium` implementation for Snake.
- **Algorithm:** **PPO (Proximal Policy Optimization)** using `Stable Baselines 3`.
- **Management:** `uv` (Rust-based Python manager) for speed and reproducibility.
- **Experiment Tracking:** **MLflow** for logging hyperparameters, metrics, and model artifacts.
- **Validation:** Automated evaluation using `EvalCallback` to track the best model during training.
- **Testing:** Unit tests with `pytest` to guarantee environment logic integrity.
- **Config:** Decoupled configuration via `config.yaml` for flexible experimentation.

### 2. Web Deployment (`/webapp`)

- **Edge Inference:** Real-time model execution using `ONNX Runtime Web` (WASM).
- **Frontend:** React + TypeScript + Vite.
- **Pipeline:** Automated export of the _best_ trained model to **ONNX**.

## Tech Stack

- **ML:** Python, Gymnasium, Stable Baselines 3, PyTorch.
- **Ops:** **MLflow**, `uv`, ONNX, Pytest, PyYAML.
- **Frontend:** React 18, TypeScript, TailwindCSS.

## ML Engineering Decisions

1.  **Hybrid Deployment:** Training in Python (research standard) and deploying via ONNX/WASM on the client side (product standard) for 0ms latency and 0$ server costs.
2.  **Continuous Validation:** Using a separate evaluation environment during training to prevent overfitting and ensure we only deploy the "Best" performing model.
3.  **Decoupled Configuration:** Moving all hyperparameters to `config.yaml` to allow for rapid iteration and systematic hyperparameter tuning without touching the code.
4.  **Integrity Testing:** Implementing unit tests for the custom RL environment to ensure the agent learns from correct game physics (collisions, rewards).

---

## Local Execution

### Requirements

- Python 3.11+ (with `uv`)
- Node.js 18+

### Setup & Testing

```bash
# Install dependencies
cd modeling
uv sync

# Run Unit Tests
uv run pytest test_env.py
```

### Training & Tracking

```bash
# Start Training (logs to MLflow)
uv run python train.py

# View Experiment Logs
uv run mlflow ui
```

### Export & Frontend

```bash
# Export best model to ONNX
uv run python export_onnx.py

# Run Web App
cd ../webapp
npm install && npm run dev
```
