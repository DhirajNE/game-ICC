// Mario-Style Platformer Game using p5.js
// Introduction to Creative Coding Final Project

let gameState = 'start'; // Possible states: 'start', 'level1', 'level2', 'gameover', 'win'
let player;
let platforms = [];
let coins = [];
let enemies = [];
let score = 0;
let lives = 3;
let level = 1;
let bgMusic, jumpSound, coinSound, enemySound, winSound;

// Load sounds
function preload() {
  soundFormats('mp3', 'wav');
  // We'll create these sounds programmatically instead of loading files
  // This avoids needing external assets
}

function setup() {
  createCanvas(800, 600);
  
  // Create sounds programmatically
  bgMusic = createSynth();
  jumpSound = createJumpSound();
  coinSound = createCoinSound();
  enemySound = createEnemySound();
  winSound = createWinSound();
  
  // Initialize player
  player = new Player(100, height - 150);
  
  // Set up level 1
  setupLevel1();
}

function draw() {
  background(135, 206, 235); // Sky blue background
  
  // Game state machine
  switch(gameState) {
    case 'start':
      drawStartScreen();
      break;
    case 'level1':
      drawLevel1();
      break;
    case 'level2':
      drawLevel2();
      break;
    case 'gameover':
      drawGameOverScreen();
      break;
    case 'win':
      drawWinScreen();
      break;
  }
}

// Create synthesized sounds without external assets
function createSynth() {
  // This will be used for background music
  let osc = new p5.Oscillator('sine');
  let env = new p5.Envelope();
  osc.amp(env);
  return {
    osc: osc,
    env: env,
    play: function() {
      osc.start();
      env.setADSR(0.001, 0.5, 0.1, 0.5);
      env.setRange(0.1, 0);
      env.play();
    }
  };
}

function createJumpSound() {
  let osc = new p5.Oscillator('triangle');
  let env = new p5.Envelope();
  osc.amp(env);
  return {
    play: function() {
      osc.start();
      osc.freq(490, 0);
      env.setADSR(0.01, 0.1, 0.1, 0.1);
      env.setRange(0.2, 0);
      env.play();
      osc.freq(330, 0.1);
      setTimeout(() => osc.stop(), 200);
    }
  };
}

function createCoinSound() {
  let osc = new p5.Oscillator('sine');
  let env = new p5.Envelope();
  osc.amp(env);
  return {
    play: function() {
      osc.start();
      osc.freq(880, 0);
      env.setADSR(0.01, 0.05, 0.1, 0.05);
      env.setRange(0.2, 0);
      env.play();
      osc.freq(1200, 0.05);
      setTimeout(() => osc.stop(), 150);
    }
  };
}

function createEnemySound() {
  let osc = new p5.Oscillator('sawtooth');
  let env = new p5.Envelope();
  osc.amp(env);
  return {
    play: function() {
      osc.start();
      osc.freq(150, 0);
      env.setADSR(0.01, 0.2, 0.1, 0.3);
      env.setRange(0.3, 0);
      env.play();
      osc.freq(90, 0.2);
      setTimeout(() => osc.stop(), 500);
    }
  };
}

function createWinSound() {
  let osc = new p5.Oscillator('sine');
  let env = new p5.Envelope();
  osc.amp(env);
  return {
    play: function() {
      osc.start();
      const playNote = (freq, time) => {
        setTimeout(() => {
          osc.freq(freq);
          env.setADSR(0.01, 0.1, 0.1, 0.1);
          env.setRange(0.2, 0);
          env.play();
        }, time);
      };
      
      playNote(523.25, 0);     // C5
      playNote(587.33, 200);   // D5
      playNote(659.25, 400);   // E5
      playNote(698.46, 600);   // F5
      playNote(783.99, 800);   // G5
      playNote(880.00, 1000);  // A5
      playNote(987.77, 1200);  // B5
      playNote(1046.50, 1400); // C6
      
      setTimeout(() => osc.stop(), 2000);
    }
  };
}

// Player class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 50;
    this.speed = 5;
    this.jumpForce = 12;
    this.gravity = 0.5;
    this.velocity = 0;
    this.isJumping = false;
    this.direction = 1; // 1 for right, -1 for left
    this.color = color(255, 0, 0); // Red player
  }
  
  update() {
    // Apply gravity
    this.velocity += this.gravity;
    this.y += this.velocity;
    
    // Check platform collisions
    this.checkPlatformCollisions();
    
    // Check boundaries
    if (this.y > height - this.height) {
      this.y = height - this.height;
      this.velocity = 0;
      this.isJumping = false;
    }
    
    // Check if fell off screen
    if (this.y > height) {
      lives--;
      if (lives <= 0) {
        gameState = 'gameover';
      } else {
        // Reset player position
        this.x = 100;
        this.y = height - 150;
        this.velocity = 0;
      }
    }
    
    // Check coin collisions
    this.checkCoinCollisions();
    
    // Check enemy collisions
    this.checkEnemyCollisions();
    
    // Check for level completion
    if (this.x > width - this.width && gameState === 'level1' && coins.length === 0) {
      setupLevel2();
      gameState = 'level2';
      level = 2;
      this.x = 100;
      this.y = height - 150;
    } else if (this.x > width - this.width && gameState === 'level2' && coins.length === 0) {
      gameState = 'win';
      winSound.play();
    }
  }
  
  checkPlatformCollisions() {
    for (let platform of platforms) {
      // Check if player is on top of platform
      if (
        this.x + this.width > platform.x &&
        this.x < platform.x + platform.width &&
        this.y + this.height >= platform.y &&
        this.y + this.height <= platform.y + 10 &&
        this.velocity >= 0
      ) {
        this.y = platform.y - this.height;
        this.velocity = 0;
        this.isJumping = false;
      }
    }
  }
  
  checkCoinCollisions() {
    for (let i = coins.length - 1; i >= 0; i--) {
      if (
        this.x + this.width > coins[i].x &&
        this.x < coins[i].x + coins[i].size &&
        this.y + this.height > coins[i].y &&
        this.y < coins[i].y + coins[i].size
      ) {
        coins.splice(i, 1);
        score += 10;
        coinSound.play();
      }
    }
  }
  
  checkEnemyCollisions() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (
        this.x + this.width > enemies[i].x &&
        this.x < enemies[i].x + enemies[i].width &&
        this.y + this.height > enemies[i].y &&
        this.y < enemies[i].y + enemies[i].height
      ) {
        // If jumping on top of enemy
        if (
          this.velocity > 0 &&
          this.y + this.height < enemies[i].y + enemies[i].height / 2
        ) {
          enemies.splice(i, 1);
          this.velocity = -this.jumpForce / 2;
          score += 20;
        } else {
          // Hit by enemy
          lives--;
          enemySound.play();
          if (lives <= 0) {
            gameState = 'gameover';
          } else {
            // Reset player position
            this.x = 100;
            this.y = height - 150;
            this.velocity = 0;
          }
        }
      }
    }
  }
  
  jump() {
    if (!this.isJumping) {
      this.velocity = -this.jumpForce;
      this.isJumping = true;
      jumpSound.play();
    }
  }
  
  moveLeft() {
    this.x -= this.speed;
    this.direction = -1;
  }
  
  moveRight() {
    this.x += this.speed;
    this.direction = 1;
  }
  
  display() {
    // Draw the player character
    fill(this.color);
    rect(this.x, this.y, this.width, this.height);
    
    // Add simple face details
    fill(0);
    if (this.direction === 1) {
      ellipse(this.x + this.width - 10, this.y + 15, 5, 5); // Right eye
    } else {
      ellipse(this.x + 10, this.y + 15, 5, 5); // Left eye
    }
    
    // Hat (Mario style)
    fill(200, 0, 0); // Darker red
    rect(this.x - 5, this.y, this.width + 10, 10);
  }
}

// Platform class
class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color(139, 69, 19); // Brown
  }
  
  display() {
    fill(this.color);
    rect(this.x, this.y, this.width, this.height);
    
    // Add some texture
    fill(101, 67, 33); // Darker brown
    for (let i = 0; i < this.width; i += 20) {
      rect(this.x + i, this.y, 10, 5);
    }
  }
}

// Coin class
class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.color = color(255, 215, 0); // Gold
    this.pulse = 0;
  }
  
  display() {
    // Add pulsing animation
    this.pulse += 0.05;
    let size = this.size + sin(this.pulse) * 3;
    
    fill(this.color);
    ellipse(this.x + this.size/2, this.y + this.size/2, size, size);
    
    // Add shine effect
    fill(255, 255, 200);
    ellipse(this.x + this.size/2 - 5, this.y + this.size/2 - 5, size/3, size/3);
  }
}

// Enemy class
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 30;
    this.speed = 2;
    this.type = type || 'basic'; // 'basic' or 'flying'
    this.direction = -1; // -1 left, 1 right
    this.color = color(0, 100, 0); // Dark green
    this.bounds = {
      left: x - 100,
      right: x + 100
    };
    
    if (this.type === 'flying') {
      this.flyHeight = 100;
      this.flySpeed = 2;
      this.flyDirection = 1;
      this.startY = y;
      this.color = color(100, 0, 100); // Purple for flying enemies
    }
  }
  
  update() {
    if (this.type === 'basic') {
      // Move horizontally
      this.x += this.speed * this.direction;
      
      // Change direction at bounds
      if (this.x <= this.bounds.left || this.x >= this.bounds.right) {
        this.direction *= -1;
      }
    } else if (this.type === 'flying') {
      // Move horizontally
      this.x += this.speed * this.direction;
      
      // Change direction at bounds
      if (this.x <= this.bounds.left || this.x >= this.bounds.right) {
        this.direction *= -1;
      }
      
      // Move vertically
      this.y += this.flySpeed * this.flyDirection;
      
      // Change vertical direction
      if (this.y <= this.startY - this.flyHeight || this.y >= this.startY) {
        this.flyDirection *= -1;
      }
    }
  }
  
  display() {
    fill(this.color);
    rect(this.x, this.y, this.width, this.height);
    
    // Add eyes
    fill(255);
    ellipse(this.x + 10, this.y + 10, 10, 10);
    ellipse(this.x + 30, this.y + 10, 10, 10);
    
    fill(0);
    ellipse(this.x + 10, this.y + 10, 5, 5);
    ellipse(this.x + 30, this.y + 10, 5, 5);
    
    // Add angry eyebrows
    stroke(0);
    strokeWeight(2);
    line(this.x + 5, this.y + 5, this.x + 15, this.y + 8);
    line(this.x + 25, this.y + 8, this.x + 35, this.y + 5);
    noStroke();
  }
}

// Setup level 1
function setupLevel1() {
  platforms = [];
  coins = [];
  enemies = [];
  
  // Create ground platform
  platforms.push(new Platform(0, height - 50, width, 50));
  
  // Create platforms
  platforms.push(new Platform(200, height - 150, 100, 20));
  platforms.push(new Platform(400, height - 200, 150, 20));
  platforms.push(new Platform(600, height - 250, 100, 20));
  platforms.push(new Platform(300, height - 300, 100, 20));
  platforms.push(new Platform(100, height - 350, 120, 20));
  
  // Create coins
  coins.push(new Coin(230, height - 180));
  coins.push(new Coin(450, height - 230));
  coins.push(new Coin(630, height - 280));
  coins.push(new Coin(330, height - 330));
  coins.push(new Coin(130, height - 380));
  
  // Create enemies
  enemies.push(new Enemy(300, height - 80, 'basic'));
  enemies.push(new Enemy(500, height - 230, 'basic'));
  enemies.push(new Enemy(400, height - 350, 'flying'));
}

// Setup level 2
function setupLevel2() {
  platforms = [];
  coins = [];
  enemies = [];
  
  // Create ground platform (with gaps)
  platforms.push(new Platform(0, height - 50, 200, 50));
  platforms.push(new Platform(300, height - 50, 200, 50));
  platforms.push(new Platform(600, height - 50, 200, 50));
  
  // Create platforms
  platforms.push(new Platform(150, height - 150, 80, 20));
  platforms.push(new Platform(350, height - 200, 100, 20));
  platforms.push(new Platform(500, height - 250, 120, 20));
  platforms.push(new Platform(250, height - 300, 80, 20));
  platforms.push(new Platform(400, height - 350, 100, 20));
  platforms.push(new Platform(600, height - 400, 200, 20));
  
  // Create coins
  coins.push(new Coin(180, height - 180));
  coins.push(new Coin(380, height - 230));
  coins.push(new Coin(550, height - 280));
  coins.push(new Coin(280, height - 330));
  coins.push(new Coin(430, height - 380));
  coins.push(new Coin(650, height - 430));
  coins.push(new Coin(700, height - 430));
  
  // Create enemies
  enemies.push(new Enemy(350, height - 80, 'basic'));
  enemies.push(new Enemy(450, height - 230, 'basic'));
  enemies.push(new Enemy(300, height - 330, 'flying'));
  enemies.push(new Enemy(600, height - 430, 'flying'));
  enemies.push(new Enemy(700, height - 80, 'basic'));
}

// Draw start screen
function drawStartScreen() {
  background(0, 0, 100);
  
  fill(255);
  textSize(40);
  textAlign(CENTER);
  text("Super Platform Adventure", width/2, height/3);
  
  textSize(24);
  text("Use arrow keys to move and jump", width/2, height/2);
  text("Collect all coins and reach the end", width/2, height/2 + 40);
  
  textSize(20);
  text("Press SPACE to start", width/2, height*2/3);
  
  // Draw a simple player character
  fill(255, 0, 0);
  rect(width/2 - 15, height/2 - 150, 30, 50);
  fill(200, 0, 0);
  rect(width/2 - 20, height/2 - 150, 40, 10);
  fill(0);
  ellipse(width/2 - 5, height/2 - 135, 5, 5);
  
  // Draw a coin
  fill(255, 215, 0);
  ellipse(width/2 - 50, height/2 - 120, 20, 20);
  
  // Draw an enemy
  fill(0, 100, 0);
  rect(width/2 + 30, height/2 - 130, 40, 30);
}

// Draw level 1
function drawLevel1() {
  // Draw background elements (clouds, sun, etc.)
  drawBackground(1);
  
  // Update and draw platforms
  for (let platform of platforms) {
    platform.display();
  }
  
  // Update and draw coins
  for (let coin of coins) {
    coin.display();
  }
  
  // Update and draw enemies
  for (let enemy of enemies) {
    enemy.update();
    enemy.display();
  }
  
  // Update and draw player
  player.update();
  player.display();
  
  // Draw UI
  drawUI();
}

// Draw level 2
function drawLevel2() {
  // Draw background elements (different style for level 2)
  drawBackground(2);
  
  // Update and draw platforms
  for (let platform of platforms) {
    platform.display();
  }
  
  // Update and draw coins
  for (let coin of coins) {
    coin.display();
  }
  
  // Update and draw enemies
  for (let enemy of enemies) {
    enemy.update();
    enemy.display();
  }
  
  // Update and draw player
  player.update();
  player.display();
  
  // Draw UI
  drawUI();
}

// Draw background elements
function drawBackground(level) {
  // Different backgrounds for different levels
  if (level === 1) {
    background(135, 206, 235); // Sky blue
    
    // Sun
    fill(255, 255, 0);
    noStroke();
    ellipse(100, 100, 80, 80);
    
    // Clouds
    fill(255);
    ellipse(200, 80, 60, 40);
    ellipse(230, 80, 70, 50);
    ellipse(260, 80, 60, 40);
    
    ellipse(500, 120, 70, 50);
    ellipse(530, 120, 80, 60);
    ellipse(560, 120, 70, 50);
  } else {
    // Level 2 - evening sky
    background(70, 130, 180); // Steel blue
    
    // Moon
    fill(255, 255, 200);
    noStroke();
    ellipse(700, 100, 60, 60);
    
    // Stars
    fill(255);
    for (let i = 0; i < 50; i++) {
      let x = random(width);
      let y = random(height/2);
      ellipse(x, y, 2, 2);
    }
    
    // Mountains in background
    fill(50, 50, 80);
    triangle(0, height - 50, 200, height - 250, 400, height - 50);
    triangle(300, height - 50, 500, height - 200, 700, height - 50);
    triangle(600, height - 50, 800, height - 300, 900, height - 50);
  }
}

// Draw UI elements
function drawUI() {
  // Draw score
  fill(255);
  textSize(20);
  textAlign(LEFT);
  text("Score: " + score, 20, 30);
  
  // Draw lives
  text("Lives: " + lives, 20, 60);
  
  // Draw level indicator
  text("Level: " + level, 20, 90);
  
  // Draw coins remaining
  text("Coins: " + coins.length + " remaining", 20, 120);
}

// Draw game over screen
function drawGameOverScreen() {
  background(0);
  
  fill(255, 0, 0);
  textSize(40);
  textAlign(CENTER);
  text("GAME OVER", width/2, height/3);
  
  fill(255);
  textSize(24);
  text("Final Score: " + score, width/2, height/2);
  
  textSize(20);
  text("Press SPACE to try again", width/2, height*2/3);
}

// Draw win screen
function drawWinScreen() {
  background(0, 100, 0);
  
  fill(255, 215, 0);
  textSize(40);
  textAlign(CENTER);
  text("YOU WIN!", width/2, height/3);
  
  fill(255);
  textSize(24);
  text("Final Score: " + score, width/2, height/2);
  
  textSize(20);
  text("Press SPACE to play again", width/2, height*2/3);
}

// Handle key presses
function keyPressed() {
  if (keyCode === 32) { // SPACE
    if (gameState === 'start') {
      gameState = 'level1';
    } else if (gameState === 'gameover' || gameState === 'win') {
      // Reset game
      gameState = 'start';
      score = 0;
      lives = 3;
      level = 1;
      player = new Player(100, height - 150);
      setupLevel1();
    }
  }
  
  if (gameState === 'level1' || gameState === 'level2') {
    if (keyCode === UP_ARROW) {
      player.jump();
    }
  }
}

// Handle keys being held down
function checkKeysHeld() {
  if (gameState === 'level1' || gameState === 'level2') {
    if (keyIsDown(LEFT_ARROW)) {
      player.moveLeft();
    }
    if (keyIsDown(RIGHT_ARROW)) {
      player.moveRight();
    }
  }
}

// Make sure we check for held down keys every frame
function draw() {
  background(135, 206, 235); // Sky blue background
  
  // Game state machine
  switch(gameState) {
    case 'start':
      drawStartScreen();
      break;
    case 'level1':
      checkKeysHeld(); // Check for held keys
      drawLevel1();
      break;
    case 'level2':
      checkKeysHeld(); // Check for held keys
      drawLevel2();
      break;
    case 'gameover':
      drawGameOverScreen();
      break;
    case 'win':
      drawWinScreen();
      break;
  }
}