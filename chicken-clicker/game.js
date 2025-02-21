let chickens = [];
let gameRunning = true;
let wrongChickenIndex = -1;
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let showHitboxes = false;
let scorePaused = false;

class Chicken {
  constructor(isWrongOne = false) {
    this.element = document.createElement('div');
    this.element.className = 'chicken';
    this.element.style.backgroundImage = 'url("chicken.png")';
    this.element.style.backgroundSize = 'contain';
    this.element.style.backgroundRepeat = 'no-repeat';
    
    this.hitbox = document.createElement('div');
    this.hitbox.className = 'chicken-hitbox';
    this.element.appendChild(this.hitbox);
    
    this.isWrongOne = isWrongOne;
    if (this.isWrongOne) {
      this.element.style.filter = 'brightness(0.9)';
    }
    
    this.x = Math.random() * (window.innerWidth - 40);
    this.y = -40;
    this.speed = 2 + Math.random() * 2;
    
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
    
    this.element.addEventListener('click', () => this.onClick());
    document.getElementById('game-container').appendChild(this.element);
  }

  update() {
    this.y += this.speed;
    this.element.style.top = `${this.y}px`;
    
    if (this.y + 40 >= window.innerHeight - 50) {
      if (this.isWrongOne) {
        handleWrongChickenGround();
      } else {
        gameOver();
      }
      return true;
    }
    return false;
  }

  onClick() {
    if (this.isWrongOne) {
      gameOver();
    } else if (!scorePaused) {
      const pointSound = new Audio('point.mp3');
      pointSound.play();
      updateScore(1);
      this.explode();
      chickens = chickens.filter(c => c !== this);
    }
  }

  remove() {
    this.element.remove();
  }

  explode() {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${this.x}px`;
    explosion.style.top = `${this.y}px`;
    document.getElementById('game-container').appendChild(explosion);
    
    explosion.addEventListener('animationend', () => explosion.remove());
    this.remove();
  }
}

function updateScore(points) {
  if (!scorePaused) {
    score += points;
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = `Score: ${score}`;
    
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore.toString());
      updateHighScore();
      scoreElement.classList.add('gold-score');
    }
  }
}

function updateHighScore() {
  document.getElementById('high-score').textContent = `High Score: ${highScore}`;
  document.getElementById('final-high-score').textContent = highScore;
}

function handleWrongChickenGround() {
  // Find the wrong chicken
  const wrongChicken = chickens[wrongChickenIndex];
  if (wrongChicken) {
    wrongChicken.explode();
    updateScore(2);
    
    // Remove only the wrong chicken from the array
    chickens = chickens.filter(chicken => chicken !== wrongChicken);
  }
  
  // Reset wrong chicken index
  wrongChickenIndex = -1;
}

function spawnChicken() {
  if (!gameRunning) return;
  
  const spawnCount = 2 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < spawnCount; i++) {
    let isWrongOne = false;
    if (wrongChickenIndex === -1) {
      isWrongOne = Math.random() < 0.3;
    }
    
    const chicken = new Chicken(isWrongOne);
    if (isWrongOne) {
      wrongChickenIndex = chickens.length;
    }
    chickens.push(chicken);
  }
  
  const nextSpawn = 300 + Math.random() * 700;
  setTimeout(spawnChicken, nextSpawn);
}

function updateChickens() {
  if (!gameRunning) return;
  
  chickens.forEach((chicken, index) => {
    chicken.update();
  });
  
  if (wrongChickenIndex !== -1 && !chickens[wrongChickenIndex]) {
    wrongChickenIndex = chickens.length > 0 ? Math.floor(Math.random() * chickens.length) : -1;
    if (wrongChickenIndex !== -1) {
      chickens[wrongChickenIndex].isWrongOne = true;
      chickens[wrongChickenIndex].element.style.filter = 'brightness(0.9)';
    }
  }
  
  requestAnimationFrame(updateChickens);
}

function gameOver() {
  gameRunning = false;
  const loseSound = new Audio('lose2.mp3');
  loseSound.play();
  chickens.forEach(chicken => chicken.explode());
  chickens = [];
  wrongChickenIndex = -1;
  document.getElementById('game-over').classList.remove('hidden');
  document.getElementById('final-score').textContent = score;
}

function restart() {
  gameRunning = true;
  score = 0;
  document.getElementById('score').classList.remove('gold-score');
  updateScore(0);
  updateHighScore();
  document.getElementById('game-over').classList.add('hidden');
  wrongChickenIndex = -1;
  spawnChicken();
  updateChickens();
}

function toggleHitboxes() {
  showHitboxes = !showHitboxes;
  scorePaused = showHitboxes;
  document.querySelectorAll('.chicken-hitbox').forEach(hitbox => {
    hitbox.style.display = showHitboxes ? 'block' : 'none';
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'h') {
    toggleHitboxes();
  }
});

document.getElementById('restart-btn').className = 'fancy-button';
document.getElementById('back-btn').className = 'fancy-button';
document.getElementById('publish-btn').className = 'fancy-button';

document.getElementById('restart-btn').addEventListener('click', restart);
document.getElementById('back-btn').addEventListener('click', () => {
  location.reload();
});

// Add import for leaderboard
import { publishScore } from './leaderboard.js';

// Modify the event listener for the publish button
document.getElementById('publish-btn').addEventListener('click', async () => {
  await publishScore(highScore);
});

// Initialize
window.addEventListener('startGame', () => {
  updateHighScore();
  spawnChicken();
  updateChickens();
});

// Start with menu
import { initMenu } from './menu.js';
initMenu();