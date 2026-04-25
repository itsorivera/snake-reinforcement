import gymnasium as gym
from gymnasium import spaces
import numpy as np
import random

class SnakeEnv(gym.Env):
    """
    Custom Snake environment for Gymnasium.
    """
    metadata = {"render_modes": ["human", "rgb_array"], "render_fps": 30}

    def __init__(self, grid_size=20):
        super(SnakeEnv, self).__init__()
        self.grid_size = grid_size
        
        # Action Space: 0: Left, 1: Right, 2: Up, 3: Down
        self.action_space = spaces.Discrete(4)
        
        # Observation Space (11 values):
        # - Danger (Up, Down, Left, Right) - 4 bits
        # - Current direction - 4 bits (One-hot)
        # - Relative food location - 3 bits (Vertical, Horizontal, Distance)
        self.observation_space = spaces.Box(low=0, high=1, shape=(11,), dtype=np.float32)

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        
        # Initialize snake in the center
        self.snake = [(self.grid_size // 2, self.grid_size // 2)]
        self.direction = 3 # Initially downwards
        self.score = 0
        self.steps = 0
        
        self.food = self._place_food()
        
        return self._get_obs(), {}

    def _place_food(self):
        while True:
            food = (random.randint(0, self.grid_size - 1), random.randint(0, self.grid_size - 1))
            if food not in self.snake:
                return food

    def _get_obs(self):
        head_x, head_y = self.snake[0]
        
        # Immediate danger
        danger = [
            self._is_collision(head_x, head_y - 1), # Up
            self._is_collision(head_x, head_y + 1), # Down
            self._is_collision(head_x - 1, head_y), # Left
            self._is_collision(head_x + 1, head_y), # Right
        ]
        
        # Current direction
        dir_one_hot = [0, 0, 0, 0]
        dir_one_hot[self.direction] = 1
        
        # Relative food
        food_obs = [
            1.0 if self.food[1] < head_y else 0.0, # Food above
            1.0 if self.food[0] < head_x else 0.0, # Food left
            1.0 if self.food[0] > head_x else 0.0, # Food right (simplified)
        ]
        
        return np.array(danger + dir_one_hot + food_obs, dtype=np.float32)

    def _is_collision(self, x, y):
        if x < 0 or x >= self.grid_size or y < 0 or y >= self.grid_size:
            return 1.0
        if (x, y) in self.snake:
            return 1.0
        return 0.0

    def step(self, action):
        self.steps += 1
        
        # Validate that it doesn't move backwards (optional, but useful)
        # 0:L, 1:R, 2:U, 3:D
        if (action == 0 and self.direction == 1) or \
           (action == 1 and self.direction == 0) or \
           (action == 2 and self.direction == 3) or \
           (action == 3 and self.direction == 2):
            pass # Keep current direction to avoid instant suicide
        else:
            self.direction = action

        # Move head
        head_x, head_y = self.snake[0]
        if self.direction == 0: head_x -= 1
        elif self.direction == 1: head_x += 1
        elif self.direction == 2: head_y -= 1
        elif self.direction == 3: head_y += 1
        
        new_head = (head_x, head_y)
        
        # Check collision
        terminated = False
        reward = 0
        
        if self._is_collision(head_x, head_y):
            terminated = True
            reward = -10
            return self._get_obs(), reward, terminated, False, {}

        self.snake.insert(0, new_head)
        
        # Check food
        if new_head == self.food:
            self.score += 1
            reward = 10
            self.food = self._place_food()
        else:
            self.snake.pop()
            reward = -0.1 # Small penalty per step to avoid loops
            
        # Truncation if it lasts too long (optional)
        truncated = self.steps > 2000
            
        return self._get_obs(), reward, terminated, truncated, {"score": self.score}
