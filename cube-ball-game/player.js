export class Player {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = 3;
    this.rotation = 0;
    this.rotationSpeed = 0.05;
    this.color = '#eee';
    this.velocityY = 0;
    this.gravity = 0.2;
    this.grounded = false;
    this.jumpSpeed = -6;
  }

  update(input, groundHeight) {
    let horizontalMovement = 0;

    if (input.isKeyDown('a')) {
      horizontalMovement -= this.speed;
    }
    if (input.isKeyDown('d')) {
      horizontalMovement += this.speed;
    }

    this.x += horizontalMovement;
    this.rotation += horizontalMovement * this.rotationSpeed;

    // Jump
    if (input.isKeyDown(' ') && this.grounded) {
      this.velocityY = this.jumpSpeed;
      this.grounded = false;
    }

    // Gravity
    this.velocityY += this.gravity;
    this.y += this.velocityY;

    // Ground collision
    if (this.y + this.size / 2 > groundHeight) {
      this.y = groundHeight - this.size / 2;
      this.velocityY = 0;
      this.grounded = true;
    }

    this.rotation %= (2 * Math.PI); // Keep rotation within 0-2PI
  }

  draw(ctx) {
    ctx.save(); // Save the current context state
    ctx.translate(this.x, this.y); // Translate to the player's position
    ctx.rotate(this.rotation); // Rotate around the player's center

    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size); // Draw the cube centered at 0,0

    ctx.restore(); // Restore the context to its original state
  }
}