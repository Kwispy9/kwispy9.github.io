export class PhysicsChicken {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocity = { x: 0, y: 0 };
    this.radius = 20;
    this.restitution = 0.5;
    this.mass = 1;
    this.gravity = 0.5;
    this.friction = 0.99;
    
    this.element = document.createElement('div');
    this.element.className = 'chicken';
    this.element.style.backgroundImage = 'url("chicken.png")';
    this.element.style.backgroundSize = 'contain';
    this.element.style.backgroundRepeat = 'no-repeat';
    
    this.hitbox = document.createElement('div');
    this.hitbox.className = 'chicken-hitbox';
    
    this.element.appendChild(this.hitbox);
    document.getElementById('menu-container').appendChild(this.element);
    
    // Add click handler for menu chickens
    this.element.addEventListener('click', () => {
      // Apply random impulse when clicked
      this.velocity.x += (Math.random() - 0.5) * 20;
      this.velocity.y -= 10 + Math.random() * 10;
      
      // 10% chance to explode when clicked
      if (Math.random() < 0.1) {
        this.explode();
        // Remove from menu chickens array
        const menuChickens = window.menuChickens;
        if (menuChickens) {
          const index = menuChickens.indexOf(this);
          if (index > -1) {
            menuChickens.splice(index, 1);
          }
        }
      }
    });
  }

  checkCollision(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < this.radius + other.radius) {
      // Calculate collision normal
      const nx = dx / distance;
      const ny = dy / distance;
      
      // Calculate relative velocity
      const rvx = other.velocity.x - this.velocity.x;
      const rvy = other.velocity.y - this.velocity.y;
      
      // Calculate relative velocity in terms of normal direction
      const velAlongNormal = rvx * nx + rvy * ny;
      
      // Do not resolve if objects are moving apart
      if (velAlongNormal > 0) return;
      
      // Calculate impulse scalar
      const j = -(1 + this.restitution) * velAlongNormal;
      const impulse = j / (1 / this.mass + 1 / other.mass);
      
      // Apply impulse
      this.velocity.x -= (impulse * nx) / this.mass;
      this.velocity.y -= (impulse * ny) / this.mass;
      other.velocity.x += (impulse * nx) / other.mass;
      other.velocity.y += (impulse * ny) / other.mass;
      
      // Separate the chickens to prevent sticking
      const overlap = (this.radius + other.radius - distance) / 2;
      this.x -= overlap * nx;
      this.y -= overlap * ny;
      other.x += overlap * nx;
      other.y += overlap * ny;
    }
  }

  update() {
    this.velocity.y += this.gravity;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    
    // Ground collision
    if (this.y + this.radius > window.innerHeight - 50) {
      this.y = window.innerHeight - 50 - this.radius;
      this.velocity.y = -this.velocity.y * this.restitution;
    }
    
    // Wall collisions
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.velocity.x = -this.velocity.x * this.restitution;
    }
    if (this.x + this.radius > window.innerWidth) {
      this.x = window.innerWidth - this.radius;
      this.velocity.x = -this.velocity.x * this.restitution;
    }
    
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    
    this.element.style.left = `${this.x - this.radius}px`;
    this.element.style.top = `${this.y - this.radius}px`;
  }

  explode() {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${this.x - 30}px`;
    explosion.style.top = `${this.y - 30}px`;
    document.getElementById('menu-container').appendChild(explosion);
    
    explosion.addEventListener('animationend', () => explosion.remove());
    this.element.remove();
  }
}