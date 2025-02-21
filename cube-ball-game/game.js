import { Input } from './input.js';
import { Game } from './game_class.js';
import { Player } from './player.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const input = new Input();

const player = new Player(canvas.width / 2, canvas.height / 2 - 50, 20); // x, y, size, subtract to accomodate ground

const game = new Game(ctx, canvas, input, player);

let lastTime = 0;
function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  game.update(deltaTime);
  game.draw();
  requestAnimationFrame(gameLoop);
}

gameLoop(0);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  game.canvasWidth = window.innerWidth;
  game.canvasHeight = window.innerHeight;
  game.groundHeight = canvas.height - 50; // adjust ground on resize
});

// Reset Button Functionality
const resetButton = document.getElementById('resetButton');
resetButton.addEventListener('click', () => {
    game.reset();
});