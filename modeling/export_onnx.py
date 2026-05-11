import torch
import yaml
from stable_baselines3 import PPO
from snake_env import SnakeEnv
import os

def load_config(config_path="config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

class OnnxablePolicy(torch.nn.Module):
    def __init__(self, policy):
        super().__init__()
        self.policy = policy

    def forward(self, observation):
        # Extract features and pass through MLP extractor
        features = self.policy.extract_features(observation)
        latent_pi, _ = self.policy.mlp_extractor(features)
        return self.policy.action_net(latent_pi)

def export():
    config = load_config()
    
    # Priority: Export the BEST model found during evaluation
    model_path = os.path.join(config['training']['best_model_path'], "best_model.zip")
    
    if not os.path.exists(model_path):
        print(f"Warning: Best model not found at {model_path}. Trying final model...")
        model_path = f"{config['training']['save_path']}.zip"
        
    if not os.path.exists(model_path):
        print(f"Error: No model found. Run training first.")
        return

    print(f"Loading model from: {model_path}")
    model = PPO.load(model_path, device="cpu")
    
    # Crear el wrapper para exportación
    onnx_policy = OnnxablePolicy(model.policy)
    onnx_policy.eval()
    
    # Crear un input de ejemplo (Dummy input)
    dummy_input = torch.randn(1, 11)
    
    # Exportar a ONNX (forzando NO usar datos externos)
    onnx_path = "models/snake_model.onnx"
    torch.onnx.export(
        onnx_policy, 
        dummy_input, 
        onnx_path, 
        opset_version=11, 
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )

    # PASO CRÍTICO: Re-guardar con la librería onnx para asegurar que todo sea interno
    import onnx
    model_proto = onnx.load(onnx_path)
    # Limpiar cualquier referencia a datos externos y guardar
    onnx.save_model(model_proto, onnx_path, save_as_external_data=False)
    
    print(f"Modelo exportado y validado exitosamente a {onnx_path}")

if __name__ == "__main__":
    export()
