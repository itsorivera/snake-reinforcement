import os
import yaml
import mlflow
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import EvalCallback
from stable_baselines3.common.monitor import Monitor
from snake_env import SnakeEnv

def load_config(config_path="config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def train():
    # Load configuration
    config = load_config()
    
    # Configure MLflow
    mlflow.set_experiment("Snake-RL-Project")
    
    # Create directories
    os.makedirs("models", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    # Start MLflow run
    with mlflow.start_run(run_name="PPO-Snake-Training"):
        # Log hyperparameters and configuration
        mlflow.log_params(config['hyperparameters'])
        mlflow.log_params(config['env'])
        mlflow.log_artifact("config.yaml")
        
        # Create environment with Monitor for logging
        env = SnakeEnv(grid_size=config['env']['grid_size'])
        env = Monitor(env)
        
        # Create separate evaluation environment
        eval_env = SnakeEnv(grid_size=config['env']['grid_size'])
        eval_env = Monitor(eval_env)
        
        # Setup Evaluation Callback
        eval_callback = EvalCallback(
            eval_env, 
            best_model_save_path=config['training']['best_model_path'],
            log_path="logs/eval", 
            eval_freq=config['training']['eval_freq'],
            deterministic=True, 
            render=False,
            n_eval_episodes=config['training']['n_eval_episodes']
        )
        
        # Create PPO model
        model = PPO(
            "MlpPolicy", 
            env, 
            verbose=1, 
            device="cpu", # Ensure reproducibility across environments
            **config['hyperparameters']
        )
        
        print(f"Starting training for {config['training']['total_timesteps']} steps...")
        
        # Train with callback
        model.learn(
            total_timesteps=config['training']['total_timesteps'],
            callback=eval_callback
        )
        
        # Save and Log artifacts
        final_model_path = config['training']['save_path']
        model.save(final_model_path)
        
        # MLflow Logs
        mlflow.log_artifact(f"{final_model_path}.zip")
        mlflow.log_artifact(f"{config['training']['best_model_path']}/best_model.zip")
        
        print(f"Training complete. Logs available in MLflow.")
        print(f"Final model: {final_model_path}.zip")
        print(f"Best model: {config['training']['best_model_path']}/best_model.zip")

if __name__ == "__main__":
    train()
