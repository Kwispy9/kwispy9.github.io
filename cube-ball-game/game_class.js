class Game {
  constructor(ctx, canvas, input, player) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.input = input;
    this.player = player;
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.groundHeight = canvas.height - 50;
    this.groundColor = '#444';
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.obstacleInterval = 1500;
    this.playerInitialX = this.player.x;
    this.playerInitialY = this.player.y;
    this.wallSpeed = 2;
    this.paused = false;
    this.pauseCooldown = false;
    this.score = 0;
    this.showHitboxes = false;
    this.obstacleSpawnCounter = {};
  }

  update(deltaTime) {
    if (this.input.isKeyDown('p') && !this.pauseCooldown) {
      this.paused = !this.paused;
      this.pauseCooldown = true;
      setTimeout(() => {
        this.pauseCooldown = false;
      }, 200); // 200ms cooldown
    }

    if (this.input.isKeyDown('h')) {
      this.showHitboxes = !this.showHitboxes;
    }

    this.player.update(this.input, this.groundHeight);

    if (this.paused) {
      this.checkCollisions();
      this.checkOutOfBounds();
      this.player.update(this.input, this.groundHeight); //Player can move when paused
      return; // Skip obstacle update if paused, but keep collision checks
    }

    this.updateObstacles(deltaTime);
    this.checkCollisions();
    this.checkOutOfBounds();
    this.score += deltaTime/1000;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.fillStyle = this.groundColor;
    this.ctx.fillRect(0, this.groundHeight, this.canvasWidth, this.canvasHeight - this.groundHeight);

    if (this.showHitboxes) {
      this.ctx.strokeStyle = 'blue';
      this.ctx.strokeRect(0, this.groundHeight, this.canvasWidth, this.canvasHeight - this.groundHeight);
    }

    this.obstacles.forEach(obstacle => {
      if (obstacle instanceof Wall) {
        obstacle.draw(this.ctx, this.groundColor);
      } else {
        obstacle.draw(this.ctx, this.groundColor);
      }

      if (this.showHitboxes) {
        this.ctx.strokeStyle = (obstacle instanceof Wall) ? 'blue' : 'red';
        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
    });

    this.player.draw(this.ctx);

    if (this.showHitboxes) {
      this.ctx.strokeStyle = 'red';
      this.ctx.strokeRect(this.player.x - this.player.size / 2, this.player.y - this.player.size / 2, this.player.size, this.player.size);
    }

    if (this.paused) {
      this.drawPauseText();
    }
  }

  drawPauseText() {
    this.ctx.font = '30px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Paused', this.canvasWidth - 20, 40);
  }

  updateObstacles(deltaTime) {
    this.obstacleTimer += deltaTime;
    if (this.obstacleTimer > this.obstacleInterval) {
      this.addObstacle();
      this.obstacleTimer = 0;
    }

    this.obstacles.forEach(obstacle => {
      obstacle.update();
    });

    this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
  }

  addObstacle() {
    const obstacleTypes = ['wall', 'lava', 'spike'];
    let obstacleType;
  
    // Filter out obstacle types that have reached the maximum consecutive spawns
    const availableObstacleTypes = obstacleTypes.filter(type => {
      return !this.obstacleSpawnCounter[type] || this.obstacleSpawnCounter[type] < 3;
    });
  
    // If all obstacle types have reached the maximum consecutive spawns, reset the counters
    if (availableObstacleTypes.length === 0) {
      this.resetObstacleSpawnCounter();
    }
  
    // Adjust probabilities based on availability
    if (availableObstacleTypes.includes('wall') && availableObstacleTypes.includes('lava') && availableObstacleTypes.includes('spike')) {
      // Use the original probabilities if all types are available
      obstacleType = Math.random() < 0.05 ? 'wall' : (Math.random() < 0.15 ? 'lava' : 'spike');
    } else {
      // Adjust probabilities if one or more types are unavailable
      let adjustedProb = Math.random();
      if (availableObstacleTypes.includes('wall')) {
        if (adjustedProb < 0.05) {
          obstacleType = 'wall';
        } else if (availableObstacleTypes.includes('lava') && adjustedProb < 0.5) {
          obstacleType = 'lava';
        } else if (availableObstacleTypes.includes('spike')) {
          obstacleType = 'spike';
        } else {
          obstacleType = availableObstacleTypes[0]; // Fallback to the available type
        }
      } else if (availableObstacleTypes.includes('lava')) {
        if (adjustedProb < 0.15) {
          obstacleType = 'lava';
        } else if (availableObstacleTypes.includes('spike')) {
          obstacleType = 'spike';
        } else {
          obstacleType = availableObstacleTypes[0]; // Fallback to the available type
        }
      } else if (availableObstacleTypes.includes('spike')) {
        obstacleType = 'spike';
      } else {
        obstacleType = 'spike';
      }
    }
  
    // Update spawn counter
    this.obstacleSpawnCounter[obstacleType] = (this.obstacleSpawnCounter[obstacleType] || 0) + 1;
  
    // Reset other counters if a new type is spawned
    obstacleTypes.forEach(type => {
      if (type !== obstacleType) {
        this.obstacleSpawnCounter[type] = 0;
      }
    });
  
    let obstacle;
    if (obstacleType === 'wall') {
      obstacle = new Wall(
        this.canvasWidth,
        this.groundHeight,
        this.player.speed + 1
      );
    } else {
      obstacle = new Obstacle(
        this.canvasWidth,
        this.groundHeight,
        obstacleType,
        this.player.speed + 1
      );
    }
  
    this.obstacles.push(obstacle);
  }
  
  resetObstacleSpawnCounter() {
    this.obstacleSpawnCounter = {};
  }

  checkCollisions() {
    this.obstacles.forEach(obstacle => {
      if (obstacle instanceof Wall) {
        if (
          this.player.x - this.player.size / 2 < obstacle.x + obstacle.width &&
          this.player.x + this.player.size / 2 > obstacle.x &&
          this.player.y + this.player.size / 2 > obstacle.y &&
          this.player.y - this.player.size / 2 < obstacle.y + obstacle.height
        ) {
          if (this.player.y + this.player.size / 2 > obstacle.y && this.player.y - this.player.size / 2 < obstacle.y + obstacle.height) {
            // Collision occurred!
            if (this.player.x < obstacle.x + obstacle.width / 2) {
              this.player.x = obstacle.x - this.player.size / 2;
            } else {
              this.player.x = obstacle.x + obstacle.width + this.player.size / 2;
            }
          }
        }
      }
      else {
        if (
          this.player.x - this.player.size / 2 < obstacle.x + obstacle.width &&
          this.player.x + this.player.size / 2 > obstacle.x &&
          this.player.y + this.player.size / 2 > obstacle.y
        ) {
          this.reset();
        }
      }
    });
  }

  checkOutOfBounds() {
    if (this.player.x - this.player.size / 2 < 0) {
      this.reset();
    }
  }

  reset() {
    this.player.x = this.canvasWidth / 2;
    this.player.y = this.canvasHeight / 2 - 50;
    this.player.color = '#eee';
    this.obstacles = [];
    this.score = 0;
  }
}

class Obstacle {
  constructor(x, groundHeight, type, playerSpeed) {
    this.type = type;
    if (this.type === 'lava') {
      this.width = 20;
      this.height = 20;
      this.color = 'darkgreen';
    } else {
      this.width = 30;
      this.height = 10;
      this.color = 'darkred';
    }

    this.x = x;
    this.y = groundHeight - this.height;
    this.speed = playerSpeed;
  }

  update() {
    this.x -= this.speed;
  }

  draw(ctx, groundColor) {
    if (this.type === 'lava') {
      ctx.fillStyle = groundColor;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
    else {
      ctx.fillStyle = 'orange';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

class Wall {
  constructor(x, groundHeight, speed) {
    this.width = 40;
    this.height = 80;
    this.x = x;
    this.y = groundHeight - this.height;
    this.speed = speed;
    this.color = 'darkgreen';
  }

  update() {
    this.x -= this.speed;
  }

  draw(ctx, groundColor) {
    ctx.fillStyle = groundColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

export { Game };