from stable_baselines3 import PPO
from snake_env import SnakeEnv
import os

def train():
    # Create environment
    env = SnakeEnv(grid_size=20)
    
    # Create PPO model (Proximal Policy Optimization)
    # MlpPolicy is ideal for observation vectors
    model = PPO("MlpPolicy", env, verbose=1, learning_rate=0.0003, n_steps=2048)
    
    print("Starting training...")
    # Train for 100,000 steps (adjustable according to hardware)
    model.learn(total_timesteps=100000)
    
    # Save model
    os.makedirs("models", exist_ok=True)
    model.save("models/snake_ppo_model")
    print("Model saved to models/snake_ppo_model.zip")

if __name__ == "__main__":
    train()
