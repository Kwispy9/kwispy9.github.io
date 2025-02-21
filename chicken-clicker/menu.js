import { PhysicsChicken } from './physics.js';

let menuChickens = [];
let spawnInterval;

// Make menuChickens accessible to physics.js
window.menuChickens = menuChickens;

export function initMenu() {
  document.getElementById('menu-container').classList.remove('hidden');
  document.getElementById('game-container').classList.add('hidden');
  
  const playBtn = document.getElementById('play-btn');
  playBtn.className = 'fancy-button';
  
  spawnInterval = setInterval(spawnMenuChicken, 500);
  requestAnimationFrame(updateMenuChickens);
  
  playBtn.addEventListener('click', startGame);
}

function spawnMenuChicken() {
  const chicken = new PhysicsChicken(
    Math.random() * window.innerWidth,
    -40
  );
  chicken.velocity.x = (Math.random() - 0.5) * 10;
  menuChickens.push(chicken);
}

function updateMenuChickens() {
  // Update positions
  menuChickens.forEach(chicken => chicken.update());
  
  // Check collisions between all pairs of chickens
  for (let i = 0; i < menuChickens.length; i++) {
    for (let j = i + 1; j < menuChickens.length; j++) {
      menuChickens[i].checkCollision(menuChickens[j]);
    }
  }
  
  if (document.getElementById('menu-container').classList.contains('hidden')) return;
  requestAnimationFrame(updateMenuChickens);
}

async function startGame() {
  clearInterval(spawnInterval);
  
  // Sort chickens by Y position (bottom to top)
  menuChickens.sort((a, b) => b.y - a.y);
  
  for (const chicken of menuChickens) {
    chicken.explode();
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  
  menuChickens = [];
  document.getElementById('menu-container').classList.add('hidden');
  document.getElementById('game-container').classList.remove('hidden');
  
  // Start the game
  window.dispatchEvent(new Event('startGame'));
}