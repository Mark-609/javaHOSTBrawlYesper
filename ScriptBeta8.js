// ==== LOGIN & AUTO-SAVE SYSTEM ====

// Add login form HTML to page
const loginOverlay = document.createElement('div');
loginOverlay.id = 'loginOverlay';
loginOverlay.style = `
  position:fixed;left:0;top:0;width:100vw;height:100vh;
  background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;
`;
loginOverlay.innerHTML = `
  <div style="background:#222;padding:32px 40px;border-radius:18px;box-shadow:0 2px 8px #000;color:#fff;text-align:center">
    <h2>Login to Play</h2>
    <input id="loginUser" placeholder="Username" style="margin:8px 0;padding:8px;width:180px;"><br>
    <input id="loginPass" type="password" placeholder="Password" style="margin:8px 0;padding:8px;width:180px;"><br>
    <button id="loginBtn" style="margin-right:10px">Login</button>
    <button id="registerBtn">Register</button>
    <div id="loginMsg" style="color:#f66;margin-top:8px;min-height:20px"></div>
  </div>
`;
document.body.appendChild(loginOverlay);

function getUsers() {
  return JSON.parse(localStorage.getItem('users_db') || '{}');
}
function setUsers(obj) {
  localStorage.setItem('users_db', JSON.stringify(obj));
}
function setLoggedIn(username) {
  localStorage.setItem('loggedUser', username);
}
function getLoggedIn() {
  return localStorage.getItem('loggedUser');
}
function showLogin(show) {
  loginOverlay.style.display = show ? 'flex' : 'none';
}

// Handle login/register
document.getElementById('loginBtn').onclick = function() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const users = getUsers();
  if (!user || !pass) {
    document.getElementById('loginMsg').innerText = 'Please enter username and password.';
    return;
  }
  if (!users[user]) {
    document.getElementById('loginMsg').innerText = 'User not found. Register first!';
    return;
  }
  if (users[user].pass !== pass) {
    document.getElementById('loginMsg').innerText = 'Incorrect password.';
    return;
  }
  setLoggedIn(user);
  showLogin(false);
  if (typeof onLoginSuccess === "function") onLoginSuccess(user);
};

document.getElementById('registerBtn').onclick = function() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const users = getUsers();
  if (!user || !pass) {
    document.getElementById('loginMsg').innerText = 'Please enter username and password.';
    return;
  }
  if (users[user]) {
    document.getElementById('loginMsg').innerText = 'Username already exists.';
    return;
  }
  users[user] = { pass: pass };
  setUsers(users);
  setLoggedIn(user);
  document.getElementById('loginMsg').innerText = 'Registered! Logging in...';
  setTimeout(() => {
    showLogin(false);
    if (typeof onLoginSuccess === "function") onLoginSuccess(user);
  }, 400);
};

if (!getLoggedIn()) {
  showLogin(true);
} else {
  showLogin(false);
  if (typeof onLoginSuccess === "function") onLoginSuccess(getLoggedIn());
}

window.logout = function() {
  localStorage.removeItem('loggedUser');
  showLogin(true);
};

// ---- Per-User Save System ----
function getSave(username) {
  const saves = JSON.parse(localStorage.getItem('user_saves') || '{}');
  return saves[username] || null;
}
function setSave(username, data) {
  const saves = JSON.parse(localStorage.getItem('user_saves') || '{}');
  saves[username] = data;
  localStorage.setItem('user_saves', JSON.stringify(saves));
}
window.saveGameProgress = function(data) {
  const user = getLoggedIn();
  if (user) setSave(user, data);
};
window.loadGameProgress = function() {
  const user = getLoggedIn();
  return user ? getSave(user) : null;
};

// ---- Add Save/Load UI Button ----
const saveLoadDiv = document.createElement('div');
saveLoadDiv.style = 'position:fixed;bottom:10px;right:10px;z-index:9998;';
saveLoadDiv.innerHTML = `
  <button id="saveGameBtn" style="padding:7px 14px;font-size:15px">Save</button>
  <button id="loadGameBtn" style="padding:7px 14px;font-size:15px">Load</button>
  <button id="logoutGameBtn" style="padding:7px 14px;font-size:15px">Logout</button>
`;
document.body.appendChild(saveLoadDiv);
document.getElementById('saveGameBtn').onclick = function() {
  if (typeof getGameSaveData === "function") {
    const data = getGameSaveData();
    window.saveGameProgress(data);
    alert("Game progress saved!");
  } else {
    alert("Game does not support saving yet.");
  }
};
document.getElementById('loadGameBtn').onclick = function() {
  if (typeof loadGameSaveData === "function") {
    const data = window.loadGameProgress();
    if (data) {
      loadGameSaveData(data);
      alert("Game progress loaded!");
    } else {
      alert("No save found for this user.");
    }
  } else {
    alert("Game does not support loading yet.");
  }
};
document.getElementById('logoutGameBtn').onclick = function() {
  window.logout();
};
// ---- AUTO SAVE LOGIC ----
let lastAutoSave = 0;
function tryAutoSave() {
  if (typeof getGameSaveData === "function") {
    const now = Date.now();
    if (now - lastAutoSave > 1500) { // Throttle to once per 1.5s
      window.saveGameProgress(getGameSaveData());
      lastAutoSave = now;
    }
  }
}

// ==== END LOGIN & AUTO-SAVE SYSTEM ====

// ==== MAIN GAME CODE ====

// Save/Load helpers for the game
function getGameSaveData() {
  return {
    characters: characters,
    score: score,
    // Add more fields as needed
  };
}
function loadGameSaveData(data) {
  if (data.characters) {
    characters.length = 0;
    data.characters.forEach(c => characters.push(c));
  }
  if (typeof data.score === "number") score = data.score;
  // Add more restore logic as needed
}

const canvas = document.getElementById('gameCanvas');
canvas.width = 1200;
canvas.height = 800;
const ctx = canvas.getContext('2d');

let gameState = 'home';
let selectedCharacter = null;

const playerRadius = 15;
let playerX = canvas.width / 2;
let playerY = canvas.height / 2;
let playerHealth = 2800;
let playerSpeed = 2;
let playerAttackRange = 200;
let playerDamage = 20;

const projectileRadius = 5;
const projectileSpeed = 5;
const projectiles = [];

const botRadius = 15;
let bots = [];
const numBots = 8;
let botSpeed = 0.5;
let botAttackRange = 150;
let botDamage = 200;
const botShootCooldown = 1500;

let score = 0;
let gameOver = false;
let victory = false;

const walls = [];
const bushes = [];

const characters = [
    { name: 'Colt', color: 'lightblue', damage: 20, health: 2800 },
];

// Helper function to generate random numbers
function randomIntFromRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Function to create a player
function drawPlayer() {
    ctx.beginPath();
    ctx.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
    ctx.fillStyle = selectedCharacter ? selectedCharacter.color : 'lightblue';
    ctx.fill();
    ctx.closePath();
}

// Function to create a bot
function createBot(x, y, botHealth) {
    bots.push({
        x: x,
        y: y,
        radius: botRadius,
        health: botHealth,
        color: 'red',
        canShoot: true,
        isPlayer: false,
        lastShotTime: 0,
        targetX: x,
        targetY: y
    });
}

// Function to initialize bots
function initializeBots() {
    bots = [];
    let botHealth = 2000;
    if (selectedCharacter) {
        if (selectedCharacter.name === 'Colt') botHealth = 1200;
        else if (selectedCharacter.name === 'El Primo') botHealth = 3000;
        else if (selectedCharacter.name === 'Jessie') botHealth = 6000;
        else if (selectedCharacter.name === 'Poco') botHealth = 3200;
        else if (selectedCharacter.name === 'Kwark') botHealth = 1400;
        else if (selectedCharacter.name === 'Boer Bert') botHealth = 6000;
        else if (selectedCharacter.name === 'Hank') botHealth = 7100;
    }
    for (let i = 0; i < numBots - 1; i++) {
        const x = randomIntFromRange(50, canvas.width - 50);
        const y = randomIntFromRange(50, canvas.height - 50);
        createBot(x, y, botHealth);
    }
    bots.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: playerRadius,
        health: selectedCharacter ? selectedCharacter.health : 2800,
        color: selectedCharacter ? selectedCharacter.color : 'lightblue',
        canShoot: true,
        isPlayer: true,
        lastShotTime: 0,
        targetX: canvas.width / 2,
        targetY: canvas.height / 2
    });
}

function drawBots() {
    bots.forEach(bot => {
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
        ctx.fillStyle = bot.color;
        ctx.fill();
        ctx.closePath();
    });
}

function moveBots() {
    bots.forEach(bot => {
        if (!bot.isPlayer) {
            const angle = Math.atan2(bot.targetY - bot.y, bot.targetX - bot.x);
            bot.x += Math.cos(angle) * botSpeed;
            bot.y += Math.sin(angle) * botSpeed;
            const distanceToTarget = Math.hypot(bot.targetX - bot.x, bot.targetY - bot.y);
            if (distanceToTarget < 10) {
                bot.targetX = randomIntFromRange(50, canvas.width - 50);
                bot.targetY = randomIntFromRange(50, canvas.height - 50);
            }
        }
    });
}

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

function handleBotAI() {
    bots.forEach(bot => {
        if (!bot.isPlayer) {
            const distanceToPlayer = Math.hypot(playerX - bot.x, playerY - bot.y);
            if (distanceToPlayer <= botAttackRange) {
                botShoot(bot);
            }
        }
    });
}

function createProjectile(x, y, angle, source) {
    projectiles.push({
        x: x,
        y: y,
        angle: angle,
        radius: projectileRadius,
        source: source
    });
}

function drawProjectiles() {
    projectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fillStyle = projectile.source === 'player' ? 'yellow' : 'white';
        ctx.fill();
        ctx.closePath();
    });
}

function moveProjectiles() {
    projectiles.forEach((projectile, projectileIndex) => {
        projectile.x += Math.cos(projectile.angle) * projectileSpeed;
        projectile.y += Math.sin(projectile.angle) * projectileSpeed;
        // You may want to add wall collision logic here
    });
}

// Mouse movement and click handlers
canvas.addEventListener('mousemove', (event) => {
    if (gameState === 'playing') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
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
        playerX = playerBot.x;
        playerY = playerBot.y;
    }
});

canvas.addEventListener('click', (event) => {
    if (gameState === 'playing') {
        const playerBot = bots.find(bot => bot.isPlayer);
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const angle = Math.atan2(mouseY - playerBot.y, mouseX - playerBot.x);
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

function handleCollisions() {
    projectiles.forEach((projectile, projectileIndex) => {
        if (projectile.source === 'player') {
            bots.forEach((bot, botIndex) => {
                if (!bot.isPlayer) {
                    const distance = Math.hypot(projectile.x - bot.x, projectile.y - bot.y);
                    if (distance < projectile.radius + bot.radius) {
                        let damage = selectedCharacter.damage;
                        if (selectedCharacter.name === 'Colt') damage = 360;
                        if (selectedCharacter.name === 'El Primo') damage = 400;
                        if (selectedCharacter.name === 'Jessie') damage = 1000;
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
            if (distance < projectile.radius + playerRadius) {
                let randomBotDamage = randomIntFromRange(200, 600);
                randomBotDamage = Math.min(randomBotDamage, 350);
                playerBot.health -= randomBotDamage;
                projectiles.splice(projectileIndex, 1);
            }
        }
    });
    bots.forEach(bot => {
        if (!bot.isPlayer) {
            const playerBot = bots.find(bot => bot.isPlayer);
            const distance = Math.hypot(playerBot.x - bot.x, playerBot.y - bot.y);
            if (distance < playerRadius + botRadius) {
                playerBot.health -= 0.1;
            }
        }
    });
}

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
        }
    }
}

function drawHomeScreen() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
                gameOver = false;
                victory = false;
            }
        });
    }
});

function resetGame() {
    gameState = 'home';
    selectedCharacter = null;
    playerDamage = 20;
    playerHealth = 2800;
    bots = [];
    projectiles.length = 0;
    score = 0;
    gameOver = false;
    victory = false;
}

// ==== GAME LOOP ====

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'home') {
        drawHomeScreen();
    } else if (gameState === 'playing') {
        moveBots();
        drawBots();
        handleBotAI();
        moveProjectiles();
        drawProjectiles();
        drawPlayer();
        handleCollisions();
        checkGameOver();
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
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'green';
        ctx.fillText('Victory!', canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Return to Home Screen', canvas.width / 2, canvas.height / 2 + 75);
    }

    tryAutoSave();
    requestAnimationFrame(update);
}

update();
