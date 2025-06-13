const canvas = document.getElementById('gameCanvas');
canvas.width = 1200; // Increased canvas width
canvas.height = 800; // Increased canvas height
const ctx = canvas.getContext('2d');

// Game states
let gameState = 'home'; // 'home', 'playing', 'gameOver', 'victory'
let selectedCharacter = null;
let elPrimoUnlocked = false; // Track if El Primo is unlocked
let jessieUnlocked = false; // Track if Jessie is unlocked

// Game variables
const playerRadius = 15;
let playerX = canvas.width / 2;
let playerY = canvas.height / 2;
let playerHealth = 2800; // Increased player health
let playerSpeed = 2;
let playerAttackRange = 200;
let playerDamage = 20;

const projectileRadius = 5;
const projectileSpeed = 5;
const projectiles = [];

const botRadius = 15;
let bots = [];
const numBots = 8;
// BOT SPEED INCREASED for faster bots
let botSpeed = 0.8; // Increased from 0.5 to 0.8
let botAttackRange = 150;
let botDamage = 200; // Increased bot damage
const botShootCooldown = 1500; // 1.5 second cooldown

let score = 0;
let gameOver = false;
let victory = false; // Victory flag

// Walls and bushes
const walls = [];
const bushes = [];

// Character options
const characters = [
    { name: 'Colt', color: 'lightblue', damage: 360, health: 2800 },
];

// Helper function to generate random numbers
function randomIntFromRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Function to create a player
function drawPlayer() {
    ctx.beginPath();
    ctx.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
    ctx.fillStyle = selectedCharacter ? selectedCharacter.color : 'lightblue'; // Use selected character color
    ctx.fill();
    ctx.closePath();
    //drawHealthBar(playerX, playerY - playerRadius - 10, playerHealth, 2800, 'blue'); // Remove health bar
}

// Function to draw a health bar
function drawHealthBar(x, y, currentHealth, maxHealth, color) {
    const barWidth = 30;
    const barHeight = 5;
    const healthPercentage = currentHealth / maxHealth;

    // Background
    ctx.fillStyle = 'gray';
    ctx.fillRect(x - barWidth / 2, y - barHeight / 2, barWidth, barHeight);

    // Health
    ctx.fillStyle = color;
    ctx.fillRect(x - barWidth / 2, y - barHeight / 2, barWidth * healthPercentage, barHeight);
}

// Function to create a bot
function createBot(x, y, botHealth) {
    bots.push({
        x: x,
        y: y,
        radius: botRadius,
        health: botHealth,
        color: 'red',
        canShoot: true, // Bots can shoot
        isPlayer: false, // Flag to indicate if it's the player
        lastShotTime: 0, // Initialize last shot time
        targetX: x,      // Initial target for random movement
        targetY: y
    });
}

// Function to initialize bots
function initializeBots() {
    bots = []; // Clear existing bots
    let botHealth = 2000; // Default bot health
    if (selectedCharacter) {
        if (selectedCharacter.name === 'Colt') {
            botHealth = 2500; // Bots have 2500 health ONLY when playing with Colt
        } else if (selectedCharacter.name === 'El Primo') {
            botHealth = 2800; // Bots have 2800 health ONLY when playing with El Primo
        } else if (selectedCharacter.name === 'Jessie') {
            botHealth = 6900; // Bots have 6900 health ONLY when playing with Jessie
        } else if (selectedCharacter.name === 'Poco') {
            botHealth = 5800; // Bots have 5800 health ONLY when playing with Poco
        } else if (selectedCharacter.name === 'Kwark') {
            botHealth = 3000; // Bots have 3000 health ONLY when playing with Kwark
        } else if (selectedCharacter.name === 'Boer Bert') {
            botHealth = 6000; // Bots have 6000 health ONLY when playing with Boer Bert
        } else if (selectedCharacter.name === 'Hank') {
            botHealth = 12000; // Bots have 12000 health ONLY when playing with Hank
        } else if (selectedCharacter.name === 'Fang') {
            botHealth = 8100; // Bots have 8100 health ONLY when playing with Fang
        } else if (selectedCharacter.name === 'Mr. Bacon') {
            botHealth = 8700; // Bots have 8700 health ONLY when playing with Mr. Bacon
        } else if (selectedCharacter.name === 'Amir') {
            botHealth = 11000; // Bots have 11000 health ONLY when playing with Amir
        } else if (selectedCharacter.name === 'Kaas') {
            botHealth = 12500; // Bots have 12500 health ONLY when playing with Kaas
        }
    }
    for (let i = 0; i < numBots - 1; i++) { // One less bot
        const x = randomIntFromRange(50, canvas.width - 50);
        const y = randomIntFromRange(50, canvas.height - 50);
        createBot(x, y, botHealth);
    }

    // Create player as one of the bots
    bots.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: playerRadius,
        health: selectedCharacter ? selectedCharacter.health : 2800,
        color: selectedCharacter ? selectedCharacter.color : 'lightblue',
        canShoot: true,
        isPlayer: true, // Flag to indicate it's the player
        lastShotTime: 0,
        targetX: canvas.width / 2,
        targetY: canvas.height / 2
    });
}

// Function to draw bots
function drawBots() {
    bots.forEach(bot => {
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
        ctx.fillStyle = bot.color;
        ctx.fill();
        ctx.closePath();
        //drawHealthBar(bot.x, bot.y - bot.radius - 5, bot.health, 75, bot.color); //remove health bar
    });
}

// Function to move bots
function moveBots() {
    bots.forEach(bot => {
        if (!bot.isPlayer) { // Only move bots that are not the player
            // Move towards the target
            const angle = Math.atan2(bot.targetY - bot.y, bot.targetX - bot.x);
            bot.x += Math.cos(angle) * botSpeed;
            bot.y += Math.sin(angle) * botSpeed;

            // If close to the target, set a new target
            const distanceToTarget = Math.hypot(bot.targetX - bot.x, bot.targetY - bot.y);
            if (distanceToTarget < 10) {
                bot.targetX = randomIntFromRange(50, canvas.width - 50);
                bot.targetY = randomIntFromRange(50, canvas.height - 50);
            }
        }
    });
}

// Function for bot shooting
function botShoot(bot) {
    const currentTime = Date.now();
    if (currentTime - bot.lastShotTime > botShootCooldown) {
        const angle = Math.atan2(playerY - bot.y, playerX - bot.x);
        projectiles.push({
            x: bot.x,
            y: bot.y,
            angle: angle,
            radius: projectileRadius,
            source: 'bot' // Indicate that the projectile is from a bot
        });
        bot.lastShotTime = currentTime; // Update last shot time
    }
}

// Function to check if player is inside a bush
function isPlayerInBush() {
    const playerBot = bots.find(bot => bot.isPlayer);
    for (const bush of bushes) {
        const distance = Math.hypot(playerBot.x - bush.x, playerBot.y - bush.y);
        if (distance < playerRadius + bush.radius) {
            return true; // Player is in this bush
        }
    }
    return false; // Player is not in any bush
}

// Function to handle bot AI and shooting
function handleBotAI() {
    bots.forEach(bot => {
        if (!bot.isPlayer) { // Bots shoot at the player
            const distanceToPlayer = Math.hypot(playerX - bot.x, playerY - bot.y);
            if (distanceToPlayer <= botAttackRange && !isPlayerInBush()) { // Check if player is in a bush
                botShoot(bot);
            }
        }
    });
}

// Function to create projectiles
function createProjectile(x, y, angle, source) {
    projectiles.push({
        x: x,
        y: y,
        angle: angle,
        radius: projectileRadius,
        source: source // Indicate the source of the projectile
    });
}

// Function to draw projectiles
function drawProjectiles() {
    projectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fillStyle = projectile.source === 'player' ? 'yellow' : 'white'; // Different color for bot projectiles
        ctx.fill();
        ctx.closePath();
    });
}

// Function to move projectiles
function moveProjectiles() {
    projectiles.forEach((projectile, projectileIndex) => {
        projectile.x += Math.cos(projectile.angle) * projectileSpeed;
        projectile.y += Math.sin(projectile.angle) * projectileSpeed;

        // Check for collision with walls
        for (const wall of walls) {
            if (projectile.x + projectile.radius > wall.x &&
                projectile.x - projectile.radius < wall.x + wall.width &&
                projectile.y + projectile.radius > wall.y &&
                projectile.y - projectile.radius < wall.y + wall.height) {
                projectiles.splice(projectileIndex, 1); // Remove projectile upon collision
                return; // Exit the loop after collision
            }
        }
    });
}

// Function to update player position based on mouse movement
canvas.addEventListener('mousemove', (event) => {
    if (gameState === 'playing') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Find the player bot
        const playerBot = bots.find(bot => bot.isPlayer);

        const angle = Math.atan2(mouseY - playerBot.y, mouseX - playerBot.x);
        const targetX = playerBot.x + Math.cos(angle) * playerSpeed;
        const targetY = playerBot.y + Math.sin(angle) * playerSpeed;

        if (targetX > playerRadius && targetX < canvas.width - playerRadius) {
            playerBot.x = targetX;
        }
        if (targetY > playerRadius && targetY < canvas.height - playerRadius) {
            playerBot.y = targetY;
        }

        // Update global player position
        playerX = playerBot.x;
        playerY = playerBot.y;
    }
});

// Function to handle mouse click shooting
canvas.addEventListener('click', (event) => {
    if (gameState === 'playing') {
        const playerBot = bots.find(bot => bot.isPlayer);

        let angle;
        if (aimbotEnabled) {
            // Find the closest bot
            let closestBot = null;
            let minDist = Infinity;
            bots.forEach(bot => {
                if (!bot.isPlayer) {
                    const dist = Math.hypot(bot.x - playerBot.x, bot.y - playerBot.y);
                    if (dist < minDist) {
                        minDist = dist;
                        closestBot = bot;
                    }
                }
            });
            if (closestBot) {
                angle = Math.atan2(closestBot.y - playerBot.y, closestBot.x - playerBot.x);
            } else {
                // Fallback to mouse if no bots
                const rect = canvas.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                angle = Math.atan2(mouseY - playerBot.y, mouseX - playerBot.x);
            }
        } else {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            angle = Math.atan2(mouseY - playerBot.y, mouseX - playerBot.x);
        }
        createProjectile(playerBot.x, playerBot.y, angle, 'player');
    } else if (gameState === 'victory') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Check if "Return to Home Screen" button is clicked
        if (mouseX >= canvas.width / 2 - 100 && mouseX <= canvas.width / 2 + 100 &&
            mouseY >= canvas.height / 2 + 50 && mouseY <= canvas.height / 2 + 90) {
            resetGame();
        }
    } else if (gameState === 'gameOver') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Check if "Replay" button is clicked
        if (mouseX >= canvas.width / 2 - 150 && mouseX <= canvas.width / 2 - 50 &&
            mouseY >= canvas.height / 2 + 50 && mouseY <= canvas.height / 2 + 90) {
            // Replay the game
            gameState = 'playing';
            initializeBots();
            initializeWallsAndBushes();
            gameOver = false; // Reset game over state
            victory = false; // Reset victory state
            const playerBot = bots.find(bot => bot.isPlayer);
            playerBot.health = selectedCharacter ? selectedCharacter.health : 2800;
        }
        // Check if "Quit and Go to Menu" button is clicked
        else if (mouseX >= canvas.width / 2 + 50 && mouseX <= canvas.width / 2 + 150 &&
            mouseY >= canvas.height / 2 + 50 && mouseY <= canvas.height / 2 + 90) {
            resetGame();
        }
    }
});

// Function to initialize walls and bushes with random positions
function initializeWallsAndBushes() {
    walls.length = 0; // Clear existing walls
    bushes.length = 0; // Clear existing bushes

    const numWalls = 10; // Number of walls
    const numBushes = 6; // Number of bushes

    // Create random walls
    for (let i = 0; i < numWalls; i++) {
        const width = randomIntFromRange(10, 50);
        const height = randomIntFromRange(50, 200);
        const x = randomIntFromRange(0, canvas.width - width);
        const y = randomIntFromRange(0, canvas.height - height);
        walls.push({ x: x, y: y, width: width, height: height });
    }

    // Create random bushes
    for (let i = 0; i < numBushes; i++) {
        const radius = randomIntFromRange(30, 70);
        const x = randomIntFromRange(0, canvas.width - radius * 2);
        const y = randomIntFromRange(0, canvas.height - radius * 2);
        bushes.push({ x: x, y: y, radius: radius });
    }
}

// Function to draw walls
function drawWalls() {
    walls.forEach(wall => {
        ctx.fillStyle = 'gray';
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
}

// Function to draw bushes
function drawBushes() {
    bushes.forEach(bush => {
        ctx.beginPath();
        ctx.arc(bush.x, bush.y, bush.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'green';
        ctx.fill();
        ctx.closePath();
    });
}

// Function to draw static victory text
function drawVictoryText() {
    const text = 'Victory!';
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    const fontSize = 40;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'green';
    ctx.fillText(text, x, y);

    // Draw "Return to Home Screen" button
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Return to Home Screen', canvas.width / 2, canvas.height / 2 + 75);
}

// Function to handle collisions
function handleCollisions() {
    // Projectile and bot collision
    projectiles.forEach((projectile, projectileIndex) => {
        if (projectile.source === 'player') { // Only player projectiles can damage bots
            bots.forEach((bot, botIndex) => {
                if (!bot.isPlayer) { // Don't collide with the player
                    const distance = Math.hypot(projectile.x - bot.x, projectile.y - bot.y);
                    if (distance < projectile.radius + bot.radius) {
                        let damage = selectedCharacter.damage;
                        if (superBulletDamage) {
                            damage = 99999; // Super bullet damage cheat
                        } else {
                            if (selectedCharacter.name === 'Colt') {
                                damage = 360;
                            }
                            if (selectedCharacter.name === 'El Primo') {
                                damage = 400;
                            }
                            if (selectedCharacter.name === 'Jessie') {
                                damage = 1000;
                            }
                        }
                        bot.health -= damage;
                        projectiles.splice(projectileIndex, 1);
                        if (bot.health <= 0) {
                            bots.splice(botIndex, 1);
                            score += 10;
                            const playerBot = bots.find(bot => bot.isPlayer);
                            playerBot.health = Math.min(2800, playerBot.health + 20);
                        }
                    }
                }
            });
        }
    });

    // Projectile and player collision
    projectiles.forEach((projectile, projectileIndex) => {
        if (projectile.source === 'bot') { // Only bot projectiles can damage the player
            const playerBot = bots.find(bot => bot.isPlayer);
            const distance = Math.hypot(projectile.x - playerBot.x, projectile.y - playerBot.y);
            if (distance < projectile.radius + playerRadius) {
                let randomBotDamage = randomIntFromRange(200, 600);
                randomBotDamage = Math.min(randomBotDamage, 350); // Ensure damage is not more than 350
                playerBot.health -= randomBotDamage; // Decrease player health
                projectiles.splice(projectileIndex, 1);
            }
        }
    });

    // Bot and player collision
    bots.forEach(bot => {
        if (!bot.isPlayer) { // Only bots that are not the player
            const playerBot = bots.find(bot => bot.isPlayer);
            const distance = Math.hypot(playerBot.x - bot.x, playerBot.y - bot.y);
            if (distance < playerRadius + botRadius) {
                playerBot.health -= 0.1; // Minor contact damage
            }
        }
    });
}

// Function to handle game over
function checkGameOver() {
    if (gameState !== 'playing') return; // Only check if currently playing

    const playerBot = bots.find(bot => bot.isPlayer);
    if (!playerBot) return; // Exit if player not found

    if (playerBot.health <= 0) {
        playerBot.health = 0; // Prevent negative health
        gameOver = true;
        gameState = 'gameOver'; // Ensure game state is set to game over
    }

    // Check for victory
    if (bots.filter(bot => !bot.isPlayer).length === 0) {
        victory = true;
        gameState = 'victory'; // Ensure game state is set to victory

        if (selectedCharacter.name === 'Colt' && !characters.some(char => char.name === 'El Primo')) {
            // Unlock El Primo if playing as Colt
            characters.push({ name: 'El Primo', color: 'darkgreen', damage: 418, health: 6300 });
        } else if (selectedCharacter.name === 'El Primo' && !characters.some(char => char.name === 'Jessie')) {
            // Unlock Jessie if playing as El Primo
            characters.push({ name: 'Jessie', color: 'orange', damage: 1166, health: 3100 });
        } else if (selectedCharacter.name === 'Jessie' && !characters.some(char => char.name === 'Poco')) {
            // Unlock Poco if playing as Jessie
            characters.push({ name: 'Poco', color: 'purple', damage: 836, health: 3700 });
        } else if (selectedCharacter.name === 'Poco' && !characters.some(char => char.name === 'Kwark')) {
            // Unlock Kwark if playing as Poco
            characters.push({ name: 'Kwark', color: 'white', damage: 500, health: 3000 });
        } else if (selectedCharacter.name === 'Kwark' && !characters.some(char => char.name === 'Boer Bert')) {
            // Unlock Boer Bert if playing as Kwark
            characters.push({ name: 'Boer Bert', color: 'brown', damage: 1700, health: 4200 });
        } else if (selectedCharacter.name === 'Boer Bert' && !characters.some(char => char.name === 'Hank')) {
            // Unlock Hank if playing as Boer Bert
            characters.push({ name: 'Hank', color: 'blue', damage: 2000, health: 5000 });
        } else if (selectedCharacter.name === 'Hank' && !characters.some(char => char.name === 'Fang')) {
            // Unlock Fang if playing as Hank
            characters.push({ name: 'Fang', color: 'red', damage: 1360, health: 4300 });
        } else if (selectedCharacter.name === 'Hank' && !characters.some(char => char.name === 'Mr. Bacon')) {
            // Unlock Mr. Bacon if playing as Hank
            characters.push({ name: 'Mr. Bacon', color: 'pink', damage: 1750, health: 4900 });
        } else if (selectedCharacter.name === 'Mr. Bacon' && !characters.some(char => char.name === 'Amir')) {
            // Unlock Amir if playing as Mr. Bacon
            characters.push({ name: 'Amir', color: 'gold', damage: 2200, health: 5500 });
        } else if (selectedCharacter.name === 'Amir' && !characters.some(char => char.name === 'Kaas')) {
            // Unlock Kaas if playing as Amir
            characters.push({ name: 'Kaas', color: 'yellow', damage: 2500, health: 6000 });
        }
    }
}

// Function to draw the home screen
function drawHomeScreen() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Select Your Character', canvas.width / 2, 50);

    // Draw character options
    characters.forEach((character, index) => {
        const x = canvas.width / (characters.length + 1) * (index + 1);
        const y = 150;

        ctx.beginPath();
        ctx.arc(x, y, playerRadius, 0, Math.PI * 2);
        ctx.fillStyle = character.color;
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(character.name, x, y + playerRadius + 20);
    });

    ctx.font = '20px Arial';
    ctx.fillText('Click on a character to start', canvas.width / 2, 250);
}

// Event listener for character selection
canvas.addEventListener('click', (event) => {
    if (gameState === 'home') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        characters.forEach((character, index) => {
            const x = canvas.width / (characters.length + 1) * (index + 1);
            const y = 150;
            const distance = Math.hypot(mouseX - x, mouseY - y);

            if (distance < playerRadius) {
                selectedCharacter = character;
                playerDamage = character.damage; // set player damage
                playerHealth = character.health; // set player health
                gameState = 'playing';
                initializeBots();
                initializeWallsAndBushes();
                gameOver = false; // Reset game over state
                victory = false; // Reset victory state
            }
        });
    }
});

// Function to reset game state
function resetGame() {
    gameState = 'home';
    selectedCharacter = null;
    playerDamage = 20; // reset to default damage
    playerHealth = 2800; // reset to default health
    bots = [];
    projectiles = [];
    score = 0;
    gameOver = false;
    victory = false;
}

// Game loop
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'home') {
        drawHomeScreen();
    } else if (gameState === 'playing') {
        // Draw walls and bushes
        drawWalls();
        drawBushes();

        if (!gamePaused) {
            // Move and draw bots
            moveBots();
            drawBots();

            // Handle bot AI and shooting
            handleBotAI();

            // Move and draw projectiles
            moveProjectiles();
            drawProjectiles();

            // Draw player
            drawPlayer();

            // Handle collisions
            handleCollisions();

            // Check game over
            checkGameOver();
        } else {
            // Draw bots and player in their current positions
            drawBots();
            drawProjectiles();
            drawPlayer();
        }

        // Display score
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + score, 10, 20);

        // Display health
        const playerBot = bots.find(bot => bot.isPlayer);
        if (playerBot) {
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Health: ' + Math.max(0, playerBot.health), 10, 40);
        }
    } else if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over! Score: ' + score, canvas.width / 2, canvas.height / 2);

        ctx.font = '20px Arial';
        ctx.fillText('Replay', canvas.width / 2 - 100, canvas.height / 2 + 75);
        ctx.fillText('Quit and Go to Menu', canvas.width / 2 + 100, canvas.height / 2 + 75);

    } else if (gameState === 'victory') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawVictoryText();
    }

    // Always draw the cheat menu if open
    if (cheatMenuOpen) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'black';
        ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 80, 300, 160);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = 'white';
        ctx.strokeRect(canvas.width / 2 - 150, canvas.height / 2 - 80, 300, 160);

        ctx.fillStyle = 'white';
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Enter 4-digit code', canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = '32px monospace';
        ctx.fillText(cheatCodeInput.padEnd(4, '_'), canvas.width / 2, canvas.height / 2 + 10);

        ctx.font = '16px Arial';
        ctx.fillText('ESC to close', canvas.width / 2, canvas.height / 2 + 50);
        ctx.restore();
    }

    // Infinite health cheat
    if (infiniteHealth) {
        const playerBot = bots.find(bot => bot.isPlayer);
        if (playerBot) {
            playerBot.health = 999999; // Or any very high value
        }
    }

    // Auto shoot functionality
    if (autoShootEnabled && gameState === 'playing' && !gamePaused) {
        const playerBot = bots.find(bot => bot.isPlayer);
        if (playerBot) {
            let angle;
            if (aimbotEnabled) {
                // Find the closest bot
                let closestBot = null;
                let minDist = Infinity;
                bots.forEach(bot => {
                    if (!bot.isPlayer) {
                        const dist = Math.hypot(bot.x - playerBot.x, bot.y - playerBot.y);
                        if (dist < minDist) {
                            minDist = dist;
                            closestBot = bot;
                        }
                    }
                });
                if (closestBot) {
                    angle = Math.atan2(closestBot.y - playerBot.y, closestBot.x - playerBot.x);
                } else {
                    angle = 0; // Default angle if no bots
                }
            } else {
                angle = 0; // Default angle if no aimbot
            }
            // Shoot every frame (you can add a cooldown if you want)
            createProjectile(playerBot.x, playerBot.y, angle, 'player');
        }
    }

    requestAnimationFrame(update);
}

// Add these variables at the top, after other game states and variables
let cheatMenuOpen = false;
let cheatCodeInput = "";
let gamePaused = false;
let infiniteHealth = false;
let aimbotEnabled = false;
let autoShootEnabled = false; // Add this variable for auto shoot
let superBulletDamage = false; // Add this variable at the top with other cheat variables

// Add this event listener for keyboard shortcuts and cheat menu input
document.addEventListener('keydown', (event) => {
    // Always allow ESC to close the cheat menu
    if (cheatMenuOpen && event.key === "Escape") {
        cheatMenuOpen = false;
        cheatCodeInput = "";
        gamePaused = false; // Unpause when menu closes
        event.preventDefault();
        return; // Stop further processing
    }

    // Open cheat menu with CTRL+SHIFT+D
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyD' && gameState === 'playing') {
        cheatMenuOpen = true;
        cheatCodeInput = "";
        gamePaused = true; // Pause the game when menu opens
        event.preventDefault();
        return;
    }

    // If cheat menu is open, handle input
    if (cheatMenuOpen) {
        if (/^[0-9]$/.test(event.key) && cheatCodeInput.length < 4) {
            cheatCodeInput += event.key;
        } else if (event.key === "Backspace") {
            cheatCodeInput = cheatCodeInput.slice(0, -1);
        } else if (event.key === "Enter" && cheatCodeInput.length === 4) {
            if (cheatCodeInput === "0413") {
                bots = bots.filter(bot => bot.isPlayer); // Instant victory
            } else if (cheatCodeInput === "3451") {
                infiniteHealth = true; // Enable infinite health
            } else if (cheatCodeInput === "1481") {
                aimbotEnabled = true; // Enable aimbot
            } else if (cheatCodeInput === "9912") {
                autoShootEnabled = true; // Enable auto shoot
            } else if (cheatCodeInput === "9191") {
                // Instant victory and unlock all characters
                bots = bots.filter(bot => bot.isPlayer);
                const allChars = [
                    { name: 'El Primo', color: 'darkgreen', damage: 418, health: 6300 },
                    { name: 'Jessie', color: 'orange', damage: 1166, health: 3100 },
                    { name: 'Poco', color: 'purple', damage: 836, health: 3700 },
                    { name: 'Kwark', color: 'white', damage: 500, health: 3000 },
                    { name: 'Boer Bert', color: 'brown', damage: 1700, health: 4200 },
                    { name: 'Hank', color: 'blue', damage: 2000, health: 5000 },
                    { name: 'Fang', color: 'red', damage: 1360, health: 4300 },
                    { name: 'Mr. Bacon', color: 'pink', damage: 1750, health: 4900 },
                    { name: 'Amir', color: 'gold', damage: 2200, health: 5500 },
                    { name: 'Kaas', color: 'yellow', damage: 2500, health: 6000 }
                ];
                allChars.forEach(char => {
                    if (!characters.some(c => c.name === char.name)) {
                        characters.push(char);
                    }
                });
            } else if (cheatCodeInput === "0136") {
                superBulletDamage = true; // Enable super bullet damage
            }
            cheatMenuOpen = false;
            cheatCodeInput = "";
            gamePaused = false; // Unpause after code entry
        }
        event.preventDefault();
    }
});

update();
