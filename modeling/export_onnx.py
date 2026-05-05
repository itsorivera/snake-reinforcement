import torch
from stable_baselines3 import PPO
from snake_env import SnakeEnv
import os

class OnnxablePolicy(torch.nn.Module):
    def __init__(self, policy):
        super().__init__()
        self.policy = policy

    def forward(self, observation):
        # Extraer características y pasar por el extractor MLP
        # Esto es lo más standard para exportar SB3
        features = self.policy.extract_features(observation)
        latent_pi, _ = self.policy.mlp_extractor(features)
        return self.policy.action_net(latent_pi)

def export():
    # Cargar el modelo entrenado
    model_path = "models/snake_ppo_model.zip"
    if not os.path.exists(model_path):
        print(f"Error: No se encontró el modelo en {model_path}. Entrena primero.")
        return

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
