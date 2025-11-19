const canvas = document.getElementById('gameCanvas');
canvas.width = 1200; // Increased canvas width
canvas.height = 800; // Increased canvas height
const ctx = canvas.getContext('2d');

// Bush texture
let bushTexture = null;
let bushPattern = null;
const bushImage = new Image();
bushImage.crossOrigin = "anonymous";
bushImage.src = "https://i.postimg.cc/prjNZwhK/Snowy_Bush.png";
bushImage.onload = function() {
    bushPattern = ctx.createPattern(bushImage, 'repeat');
    if (bushPattern && bushPattern.setTransform) {
        const patternTransform = new DOMMatrix();
        patternTransform.a = 0.5;
        patternTransform.d = 0.5;
        bushPattern.setTransform(patternTransform);
    }
};

// Wall texture
let wallPattern = null;
const wallImage = new Image();
wallImage.crossOrigin = "anonymous";
wallImage.src = "https://i.postimg.cc/7LwgYqPc/Snowy-Wall.png";
wallImage.onload = function() {
    wallPattern = ctx.createPattern(wallImage, 'repeat');
    if (wallPattern && wallPattern.setTransform) {
        const patternTransform = new DOMMatrix();
        patternTransform.a = 0.5;
        patternTransform.d = 0.5;
        wallPattern.setTransform(patternTransform);
    }
};

// Floor texture
let floorPattern = null;
const floorImage = new Image();
floorImage.crossOrigin = "anonymous";
floorImage.src = "https://i.postimg.cc/MK86MHR3/Snowy-Floor.png";
floorImage.onload = function() {
    floorPattern = ctx.createPattern(floorImage, 'repeat');
    if (floorPattern && floorPattern.setTransform) {
        const patternTransform = new DOMMatrix();
        patternTransform.a = 0.5;
        patternTransform.d = 0.5;
        floorPattern.setTransform(patternTransform);
    }
};

// Stone deco
const stones = [];
const stoneImage = new Image();
stoneImage.crossOrigin = "anonymous";
stoneImage.src = "https://i.postimg.cc/Y0Fc35GY/Snowy_Stones.png";

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
let botSpeed = 0.8; // Increased from 0.5 to 0.8 for faster bots
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

    // Draw protection indicator
    if (playerProtection) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(playerX, playerY, playerRadius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }
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
            botHealth = 2500;
        } else if (selectedCharacter.name === 'El Primo') {
            botHealth = 2800;
        } else if (selectedCharacter.name === 'Jessie') {
            botHealth = 6900;
        } else if (selectedCharacter.name === 'Poco') {
            botHealth = 5800;
        } else if (selectedCharacter.name === 'Kwark') {
            botHealth = 3000;
        } else if (selectedCharacter.name === 'Boer Bert') {
            botHealth = 6000;
        } else if (selectedCharacter.name === 'Hank') {
            botHealth = 12000;
        } else if (selectedCharacter.name === 'Fang') {
            botHealth = 8100;
        } else if (selectedCharacter.name === 'Mr. Bacon') {
            botHealth = 8700;
        } else if (selectedCharacter.name === 'Amir') {
            botHealth = 11000;
        } else if (selectedCharacter.name === 'Kaas') {
            botHealth = 12500;
        } else if (selectedCharacter.name === 'Yesper') {
            botHealth = 12000;
        }
    }

    // All bots spawn in the center of the field
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < numBots - 1; i++) {
        createBot(centerX, centerY, botHealth);
    }

    // Spawn player at center
    bots.push({
        x: centerX,
        y: centerY,
        radius: playerRadius,
        health: selectedCharacter ? selectedCharacter.health : 2800,
        color: selectedCharacter ? selectedCharacter.color : 'lightblue',
        canShoot: true,
        isPlayer: true,
        lastShotTime: 0,
        targetX: centerX,
        targetY: centerY
    });

    // 3 seconds of protection at game start
    playerProtection = true;
    setTimeout(() => { playerProtection = false; }, 3000);
}

// Function to draw bots
function drawBots() {
    bots.forEach(bot => {
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
        ctx.fillStyle = bot.color;
        ctx.fill();
        ctx.closePath();
    });
}

// Function to move bots
function moveBots() {
    bots.forEach(bot => {
        if (!bot.isPlayer) {
            const angle = Math.atan2(bot.targetY - bot.y, bot.targetX - bot.x);
            const targetX = bot.x + Math.cos(angle) * botSpeed;
            const targetY = bot.y + Math.sin(angle) * botSpeed;

            let collidedX = false;
            let collidedY = false;

            // Check X movement
            for (const wall of walls) {
                if (
                    targetX + bot.radius > wall.x &&
                    targetX - bot.radius < wall.x + wall.width &&
                    bot.y + bot.radius > wall.y &&
                    bot.y - bot.radius < wall.y + wall.height
                ) {
                    collidedX = true;
                    break;
                }
            }

            // Check Y movement
            for (const wall of walls) {
                if (
                    bot.x + bot.radius > wall.x &&
                    bot.x - bot.radius < wall.x + wall.width &&
                    targetY + bot.radius > wall.y &&
                    targetY - bot.radius < wall.y + wall.height
                ) {
                    collidedY = true;
                    break;
                }
            }

            // If collision, bounce: pick a new direction away from wall
            if (collidedX || collidedY) {
                // Reverse direction
                bot.targetX = bot.x - Math.cos(angle) * 100;
                bot.targetY = bot.y - Math.sin(angle) * 100;
            } else {
                // Move normally
                if (targetX > bot.radius && targetX < canvas.width - bot.radius) {
                    bot.x = targetX;
                }
                if (targetY > bot.radius && targetY < canvas.height - bot.radius) {
                    bot.y = targetY;
                }
            }

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
            source: 'bot'
        });
        bot.lastShotTime = currentTime;
    }
}

// Function to check if player is inside a bush
function isPlayerInBush() {
    const playerBot = bots.find(bot => bot.isPlayer);
    for (const bush of bushes) {
        const distance = Math.hypot(playerBot.x - bush.x, playerBot.y - bush.y);
        if (distance < playerRadius + bush.radius) {
            return true;
        }
    }
    return false;
}

// Function to handle bot AI and shooting
function handleBotAI() {
    bots.forEach(bot => {
        if (!bot.isPlayer) {
            const distanceToPlayer = Math.hypot(playerX - bot.x, playerY - bot.y);
            if (distanceToPlayer <= botAttackRange && !isPlayerInBush()) {
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
        source: source
    });
}

// Function to draw projectiles
function drawProjectiles() {
    projectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fillStyle = projectile.source === 'player' ? 'yellow' : 'white';
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
                projectiles.splice(projectileIndex, 1);
                return;
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
        const playerBot = bots.find(bot => bot.isPlayer);
        const angle = Math.atan2(mouseY - playerBot.y, mouseX - playerBot.x);
        const targetX = playerBot.x + Math.cos(angle) * playerSpeed;
        const targetY = playerBot.y + Math.sin(angle) * playerSpeed;

        // Collision check with walls
        let canMoveX = true;
        let canMoveY = true;

        // Check X movement
        for (const wall of walls) {
            if (
                targetX + playerRadius > wall.x &&
                targetX - playerRadius < wall.x + wall.width &&
                playerBot.y + playerRadius > wall.y &&
                playerBot.y - playerRadius < wall.y + wall.height
            ) {
                canMoveX = false;
                break;
            }
        }

        // Check Y movement
        for (const wall of walls) {
            if (
                playerBot.x + playerRadius > wall.x &&
                playerBot.x - playerRadius < wall.x + wall.width &&
                targetY + playerRadius > wall.y &&
                targetY - playerRadius < wall.y + wall.height
            ) {
                canMoveY = false;
                break;
            }
        }

        if (canMoveX && targetX > playerRadius && targetX < canvas.width - playerRadius) {
            playerBot.x = targetX;
        }
        if (canMoveY && targetY > playerRadius && targetY < canvas.height - playerRadius) {
            playerBot.y = targetY;
        }
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
        if (mouseX >= canvas.width / 2 - 100 && mouseX <= canvas.width / 2 + 100 &&
            mouseY >= canvas.height / 2 + 50 && mouseY <= canvas.height / 2 + 90) {
            resetGame();
        }
    } else if (gameState === 'gameOver') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        if (mouseX >= canvas.width / 2 - 150 && mouseX <= canvas.width / 2 - 50 &&
            mouseY >= canvas.height / 2 + 50 && mouseY <= canvas.height / 2 + 90) {
            gameState = 'playing';
            initializeBots();
            initializeWallsAndBushes();
            gameOver = false;
            victory = false;
            const playerBot = bots.find(bot => bot.isPlayer);
            playerBot.health = selectedCharacter ? selectedCharacter.health : 2800;
        } else if (mouseX >= canvas.width / 2 + 50 && mouseX <= canvas.width / 2 + 150 &&
            mouseY >= canvas.height / 2 + 50 && mouseY <= canvas.height / 2 + 90) {
            resetGame();
        }
    }
});

// Add near the top, after other texture/image code
let menuBgPattern = null;
let menuBgImageLoaded = false;
const menuBgImage = new Image();
menuBgImage.crossOrigin = "anonymous";
menuBgImage.src = "https://i.postimg.cc/d3N72TCC/Snowy-Back-Ground.jpg";
menuBgImage.onload = function() {
    menuBgImageLoaded = true;
};

// Function to draw the home screen
function drawHomeScreen() {
    // Draw background texture, zoomed to fill the screen
    if (menuBgImageLoaded) {
        // Calculate scale to fill the canvas
        const scaleX = canvas.width / menuBgImage.width;
        const scaleY = canvas.height / menuBgImage.height;
        const scale = Math.max(scaleX, scaleY);
        const drawWidth = menuBgImage.width * scale;
        const drawHeight = menuBgImage.height * scale;
        const offsetX = (canvas.width - drawWidth) / 2;
        const offsetY = (canvas.height - drawHeight) / 2;
        ctx.save();
        ctx.drawImage(menuBgImage, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();
    } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Select Your Character', canvas.width / 2, 50);

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

// Draw stones under everything else
function drawStones() {
    stones.forEach(stone => {
        if (stoneImage.complete) {
            ctx.drawImage(stoneImage, stone.x, stone.y, stone.size, stone.size);
        }
    });
}

// Function to draw walls
function drawWalls() {
    walls.forEach(wall => {
        ctx.save();
        if (wallPattern) {
            ctx.fillStyle = wallPattern;
        } else {
            ctx.fillStyle = 'gray'; // fallback color
        }
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.restore();
    });
}

// Function to draw bushes (square with soft/rounded corners)
function drawBushes() {
    bushes.forEach(bush => {
        ctx.save();
        // Draw a rounded rectangle for each bush
        const size = bush.radius * 2;
        const x = bush.x - bush.radius;
        const y = bush.y - bush.radius;
        const r = Math.min(bush.radius, 20); // Corner radius, max 20 for "soft" corners

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + size - r, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + r);
        ctx.lineTo(x + size, y + size - r);
        ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
        ctx.lineTo(x + r, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();

        if (bushPattern) {
            ctx.fillStyle = bushPattern;
        } else {
            ctx.fillStyle = 'green'; // fallback color
        }
        ctx.fill();
        ctx.restore();
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
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Return to Home Screen', canvas.width / 2, canvas.height / 2 + 75);
}

// Function to handle collisions
function handleCollisions() {
    projectiles.forEach((projectile, projectileIndex) => {
        if (projectile.source === 'player') {
            bots.forEach((bot, botIndex) => {
                if (!bot.isPlayer) {
                    const distance = Math.hypot(projectile.x - bot.x, projectile.y - bot.y);
                    if (distance < projectile.radius + bot.radius) {
                        let damage = selectedCharacter.damage;
                        if (superBulletDamage) {
                            damage = 99999;
                        } else {
                            if (selectedCharacter.name === 'Colt') damage = 360;
                            if (selectedCharacter.name === 'El Primo') damage = 400;
                            if (selectedCharacter.name === 'Jessie') damage = 1000;
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
    projectiles.forEach((projectile, projectileIndex) => {
        if (projectile.source === 'bot') {
            const playerBot = bots.find(bot => bot.isPlayer);
            const distance = Math.hypot(projectile.x - playerBot.x, projectile.y - playerBot.y);
            if (distance < projectile.radius + playerRadius && !playerProtection) {
                let randomBotDamage = randomIntFromRange(200, 600);
                randomBotDamage = Math.min(randomBotDamage, 350);
                playerBot.health -= randomBotDamage;
                projectiles.splice(projectileIndex, 1);
            } else if (distance < projectile.radius + playerRadius && playerProtection) {
                // Remove projectile but no damage
                projectiles.splice(projectileIndex, 1);
            }
        }
    });
    bots.forEach(bot => {
        if (!bot.isPlayer) {
            const playerBot = bots.find(bot => bot.isPlayer);
            const distance = Math.hypot(playerBot.x - bot.x, playerBot.y - bot.y);
            if (distance < playerRadius + botRadius && !playerProtection) {
                playerBot.health -= 0.1;
            }
        }
    });
}

// Function to handle game over and unlocking
function checkGameOver() {
    if (gameState !== 'playing') return;
    const playerBot = bots.find(bot => bot.isPlayer);
    if (!playerBot) return;
    if (playerBot.health <= 0) {
        playerBot.health = 0;
        gameOver = true;
        gameState = 'gameOver';
    }
    if (bots.filter(bot => !bot.isPlayer).length === 0) {
        victory = true;
        gameState = 'victory';
        if (selectedCharacter.name === 'Colt' && !characters.some(char => char.name === 'El Primo')) {
            characters.push({ name: 'El Primo', color: 'darkgreen', damage: 418, health: 6300 });
        } else if (selectedCharacter.name === 'El Primo' && !characters.some(char => char.name === 'Jessie')) {
            characters.push({ name: 'Jessie', color: 'orange', damage: 1166, health: 3100 });
        } else if (selectedCharacter.name === 'Jessie' && !characters.some(char => char.name === 'Poco')) {
            characters.push({ name: 'Poco', color: 'purple', damage: 836, health: 3700 });
        } else if (selectedCharacter.name === 'Poco' && !characters.some(char => char.name === 'Kwark')) {
            characters.push({ name: 'Kwark', color: 'white', damage: 500, health: 3000 });
        } else if (selectedCharacter.name === 'Kwark' && !characters.some(char => char.name === 'Boer Bert')) {
            characters.push({ name: 'Boer Bert', color: 'brown', damage: 1700, health: 4200 });
        } else if (selectedCharacter.name === 'Boer Bert' && !characters.some(char => char.name === 'Hank')) {
            characters.push({ name: 'Hank', color: 'blue', damage: 2000, health: 5000 });
        } else if (selectedCharacter.name === 'Hank' && !characters.some(char => char.name === 'Fang')) {
            characters.push({ name: 'Fang', color: 'red', damage: 1360, health: 4300 });
        } else if (selectedCharacter.name === 'Hank' && !characters.some(char => char.name === 'Mr. Bacon')) {
            characters.push({ name: 'Mr. Bacon', color: 'pink', damage: 1750, health: 4900 });
        } else if (selectedCharacter.name === 'Mr. Bacon' && !characters.some(char => char.name === 'Amir')) {
            characters.push({ name: 'Amir', color: 'gold', damage: 2200, health: 5500 });
        } else if (selectedCharacter.name === 'Amir' && !characters.some(char => char.name === 'Kaas')) {
            characters.push({ name: 'Kaas', color: 'yellow', damage: 2500, health: 6000 });
        } else if (selectedCharacter.name === 'Kaas' && !characters.some(char => char.name === 'Yesper')) {
            characters.push({ name: 'Yesper', color: 'red', damage: 3000, health: 7000 });
        }
    }
}

// Function to draw the home screen
function drawHomeScreen() {
    // Draw background texture, zoomed to fill the screen
    if (menuBgImageLoaded) {
        // Calculate scale to fill the canvas
        const scaleX = canvas.width / menuBgImage.width;
        const scaleY = canvas.height / menuBgImage.height;
        const scale = Math.max(scaleX, scaleY);
        const drawWidth = menuBgImage.width * scale;
        const drawHeight = menuBgImage.height * scale;
        const offsetX = (canvas.width - drawWidth) / 2;
        const offsetY = (canvas.height - drawHeight) / 2;
        ctx.save();
        ctx.drawImage(menuBgImage, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();
    } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Select Your Character', canvas.width / 2, 50);

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
                playerDamage = character.damage;
                playerHealth = character.health;
                gameState = 'playing';
                initializeBots();
                initializeWallsAndBushes();
                gameOver = false;
                victory = false;
            }
        });
    }
});

// Function to reset game state
function resetGame() {
    gameState = 'home';
    selectedCharacter = null;
    playerDamage = 20;
    playerHealth = 2800;
    bots = [];
    projectiles = [];
    score = 0;
    gameOver = false;
    victory = false;
}

// Function to initialize walls and bushes
function initializeWallsAndBushes() {
    walls.length = 0;
    bushes.length = 0;
    stones.length = 0;

    // Walls
    const numWalls = 10;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const safeRadius = 80; // No walls within 80px of center

    for (let i = 0; i < numWalls; i++) {
        const width = randomIntFromRange(60, 180);
        const height = randomIntFromRange(60, 180);
        let x, y, tries = 0;
        do {
            x = randomIntFromRange(0, canvas.width - width);
            y = randomIntFromRange(0, canvas.height - height);
            tries++;
            // Ensure wall does not overlap the center spawn area
        } while (
            x < centerX + safeRadius &&
            x + width > centerX - safeRadius &&
            y < centerY + safeRadius &&
            y + height > centerY - safeRadius &&
            tries < 100
        );
        walls.push({ x, y, width, height });
    }

    // Bushes
    const numBushes = 8;
    for (let i = 0; i < numBushes; i++) {
        const radius = randomIntFromRange(30, 70);
        const x = randomIntFromRange(radius, canvas.width - radius);
        const y = randomIntFromRange(radius, canvas.height - radius);
        bushes.push({ x, y, radius });
    }

    // Stones
    const numStones = randomIntFromRange(8, 18);
    for (let i = 0; i < numStones; i++) {
        const size = randomIntFromRange(30, 60);
        const x = randomIntFromRange(0, canvas.width - size);
        const y = randomIntFromRange(0, canvas.height - size);
        stones.push({ x, y, size });
    }
}

// Game loop
function update() {
    // Draw floor texture first
    if (floorPattern) {
        ctx.save();
        ctx.fillStyle = floorPattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    drawStones();

    if (gameState === 'home') {
        drawHomeScreen();
    } else if (gameState === 'playing') {
        drawWalls();
        drawBushes();
        if (!gamePaused) {
            moveBots();
            drawBots();
            handleBotAI();
            moveProjectiles();
            drawProjectiles();
            drawPlayer();
            handleCollisions();
            checkGameOver();
        } else {
            drawBots();
            drawProjectiles();
            drawPlayer();
        }
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + score, 10, 20);
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
            playerBot.health = 999999;
        }
    }

    // Auto shoot functionality
    if (autoShootEnabled && gameState === 'playing' && !gamePaused) {
        const playerBot = bots.find(bot => bot.isPlayer);
        if (playerBot) {
            let angle;
            if (aimbotEnabled) {
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
                    angle = 0;
                }
            } else {
                angle = 0;
            }
            createProjectile(playerBot.x, playerBot.y, angle, 'player');
        }
    }

    requestAnimationFrame(update);
}
// Christmas hat
const hatImage = new Image();
hatImage.src = 'EventTextures/ChristmasHat.png';
let hatLoaded = false;
hatImage.onload = () => { hatLoaded = true; };

// Draw bots (including hats)
function drawBots() {
    bots.forEach(bot=>{
        if(bot.isPlayer) return; // skip player for now
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, bot.radius,0,Math.PI*2);
        ctx.fillStyle = bot.color;
        ctx.fill();
        ctx.closePath();

        if(hatLoaded){
            ctx.save();
            ctx.translate(bot.x + 7, bot.y - bot.radius + 15);
            ctx.rotate(20*Math.PI/180);
            const hatWidth = bot.radius*2;
            const hatHeight = bot.radius*1.5;
            ctx.drawImage(hatImage, -hatWidth/2, -hatHeight, hatWidth, hatHeight);
            ctx.restore();
        }
    });
}
// Draw player (with hat)
function drawPlayer() {
    const playerBot = bots.find(bot=>bot.isPlayer);
    if(!playerBot) return;

    ctx.beginPath();
    ctx.arc(playerBot.x, playerBot.y, playerRadius,0,Math.PI*2);
    ctx.fillStyle = selectedCharacter ? selectedCharacter.color : 'lightblue';
    ctx.fill();
    ctx.closePath();

    if(hatLoaded){
        ctx.save();
        ctx.translate(playerBot.x + 7, playerBot.y-playerRadius + 15);
        ctx.rotate(20*Math.PI/180);
        const hatWidth = playerRadius*2;
        const hatHeight = playerRadius*1.5;
        ctx.drawImage(hatImage, -hatWidth/2, -hatHeight, hatWidth, hatHeight);
        ctx.restore();
    }

    if(playerProtection){
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(playerBot.x, playerBot.y, playerRadius+8,0,Math.PI*2);
        ctx.strokeStyle='cyan';
        ctx.lineWidth=4;
        ctx.stroke();
        ctx.restore();
    }
}

// Cheat variables
let cheatMenuOpen = false;
let cheatCodeInput = "";
let gamePaused = false;
let infiniteHealth = false;
let aimbotEnabled = false;
let autoShootEnabled = false;
let superBulletDamage = false;

// Cheat menu input handling
document.addEventListener('keydown', (event) => {
    if (cheatMenuOpen && event.key === "Escape") {
        cheatMenuOpen = false;
        cheatCodeInput = "";
        gamePaused = false;
        event.preventDefault();
        return;
    }
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyD' && gameState === 'playing') {
        cheatMenuOpen = true;
        cheatCodeInput = "";
        gamePaused = true;
        event.preventDefault();
        return;
    }
    if (cheatMenuOpen) {
        if (/^[0-9]$/.test(event.key) && cheatCodeInput.length < 4) {
            cheatCodeInput += event.key;
        } else if (event.key === "Backspace") {
            cheatCodeInput = cheatCodeInput.slice(0, -1);
        } else if (event.key === "Enter" && cheatCodeInput.length === 4) {
            if (cheatCodeInput === "0413") {
                bots = bots.filter(bot => bot.isPlayer);
            } else if (cheatCodeInput === "3451") {
                infiniteHealth = true;
            } else if (cheatCodeInput === "1481") {
                aimbotEnabled = true;
            } else if (cheatCodeInput === "9912") {
                autoShootEnabled = true;
            } else if (cheatCodeInput === "9191") {
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
                    { name: 'Kaas', color: 'yellow', damage: 2500, health: 6000 },
                    { name: 'Yesper', color: 'red', damage: 3000, health: 7000 }
                ];
                allChars.forEach(char => {
                    if (!characters.some(c => c.name === char.name)) {
                        characters.push(char);
                    }
                });
            } else if (cheatCodeInput === "0136") {
                superBulletDamage = true;
            }
            cheatMenuOpen = false;
            cheatCodeInput = "";
            gamePaused = false;
        }
        event.preventDefault();
    }
});

update();
