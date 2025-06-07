// ---- Simple Login System WITH Supabase Auth ----

// 1. Add Supabase JS SDK via CDN (if not already included)
if (!window.supabase) {
  const supaScript = document.createElement('script');
  supaScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
  supaScript.onload = () => { window.supabaseLoaded = true; };
  document.head.appendChild(supaScript);
} else {
  window.supabaseLoaded = true;
}

// 2. Supabase configuration (Replace with your real values!)
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // <-- CHANGE THIS
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // <-- CHANGE THIS

let supabase = null;
function initSupabase() {
  // Only initialize once
  if (!supabase && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

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
    <input id="loginUser" placeholder="Email" style="margin:8px 0;padding:8px;width:180px;"><br>
    <input id="loginPass" type="password" placeholder="Password" style="margin:8px 0;padding:8px;width:180px;"><br>
    <button id="loginBtn" style="margin-right:10px">Login</button>
    <button id="registerBtn">Register</button>
    <div id="loginMsg" style="color:#f66;margin-top:8px;min-height:20px"></div>
  </div>
`;
document.body.appendChild(loginOverlay);

// Utility: Set/get logged-in state
function setLoggedIn(username) {
  localStorage.setItem('loggedUser', username);
}
function getLoggedIn() {
  return localStorage.getItem('loggedUser');
}

// Show/hide overlay
function showLogin(show) {
  loginOverlay.style.display = show ? 'flex' : 'none';
}

// Show username in UI (optional)
function showLoggedInUser(username) {
  let userDiv = document.getElementById('loggedInUserDiv');
  if (!userDiv) {
    userDiv = document.createElement('div');
    userDiv.id = 'loggedInUserDiv';
    userDiv.style = 'position:fixed;top:10px;left:10px;color:white;font-size:16px;z-index:9999;';
    document.body.appendChild(userDiv);
  }
  userDiv.innerText = 'Logged in as: ' + username;
}

// Supabase login/register handlers
async function supabaseLogin(email, password) {
  if (!window.supabaseLoaded) {
    document.getElementById('loginMsg').innerText = 'Loading authentication...';
    return;
  }
  initSupabase();
  if (!supabase) {
    document.getElementById('loginMsg').innerText = 'Auth not ready. Try again in a second!';
    return;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById('loginMsg').innerText = error.message || 'Login failed.';
    return false;
  }
  setLoggedIn(email);
  showLogin(false);
  showLoggedInUser(email);
  if (typeof onLoginSuccess === "function") onLoginSuccess(email);
  return true;
}

async function supabaseRegister(email, password) {
  if (!window.supabaseLoaded) {
    document.getElementById('loginMsg').innerText = 'Loading authentication...';
    return;
  }
  initSupabase();
  if (!supabase) {
    document.getElementById('loginMsg').innerText = 'Auth not ready. Try again in a second!';
    return;
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    document.getElementById('loginMsg').innerText = error.message || 'Registration failed.';
    return false;
  }
  // Optionally: auto-login after registration
  setLoggedIn(email);
  document.getElementById('loginMsg').innerText = 'Registered! Logging in...';
  setTimeout(() => {
    showLogin(false);
    showLoggedInUser(email);
    if (typeof onLoginSuccess === "function") onLoginSuccess(email);
  }, 400);
  return true;
}

// Handle login/register
document.getElementById('loginBtn').onclick = async function () {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (!user || !pass) {
    document.getElementById('loginMsg').innerText = 'Please enter email and password.';
    return;
  }
  await supabaseLogin(user, pass);
};

document.getElementById('registerBtn').onclick = async function () {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (!user || !pass) {
    document.getElementById('loginMsg').innerText = 'Please enter email and password.';
    return;
  }
  await supabaseRegister(user, pass);
};

// On page load, if a user is already logged in, skip login overlay
const lastUser = getLoggedIn();
if (lastUser) {
  showLogin(false);
  showLoggedInUser(lastUser);
  if (typeof onLoginSuccess === "function") onLoginSuccess(lastUser);
} else {
  showLogin(true);
}

// Optional: Expose login/logout API
window.logout = function () {
  localStorage.removeItem('loggedUser');
  let userDiv = document.getElementById('loggedInUserDiv');
  if (userDiv) userDiv.remove();
  showLogin(true);
};

// ---- REST OF YOUR GAME CODE BELOW ----
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
let botSpeed = 0.5; // Reduced bot speed for random movement
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
    ctx.fillStyle = selectedCharacter ? selectedCharacter.color : 'lightblue'; // Use selected character color
    ctx.fill();
    ctx.closePath();
}

// Function to draw a health bar
function drawHealthBar(x, y, currentHealth, maxHealth, color) {
    const barWidth = 30;
    const barHeight = 5;
    const healthPercentage = currentHealth / maxHealth;
    ctx.fillStyle = 'gray';
    ctx.fillRect(x - barWidth / 2, y - barHeight / 2, barWidth, barHeight);
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
        if (selectedCharacter.name === 'Colt') {
            botHealth = 1200;
        } else if (selectedCharacter.name === 'El Primo') {
            botHealth = 3000;
        } else if (selectedCharacter.name === 'Jessie') {
            botHealth = 6000;
        } else if (selectedCharacter.name === 'Poco') {
            botHealth = 3200;
        } else if (selectedCharacter.name === 'Kwark') {
            botHealth = 1400;
        } else if (selectedCharacter.name === 'Boer Bert') {
            botHealth = 6000;
        } else if (selectedCharacter.name === 'Hank') {
            botHealth = 7100;
        }
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

// Function to initialize walls and bushes with random positions
function initializeWallsAndBushes() {
    walls.length = 0;
    bushes.length = 0;
    const numWalls = 10;
    const numBushes = 6;
    for (let i = 0; i < numWalls; i++) {
        const width = randomIntFromRange(10, 50);
        const height = randomIntFromRange(50, 200);
        const x = randomIntFromRange(0, canvas.width - width);
        const y = randomIntFromRange(0, canvas.height - height);
        walls.push({ x: x, y: y, width: width, height: height });
    }
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
                        if (selectedCharacter.name === 'Colt') {
                            damage = 360;
                        }
                        if (selectedCharacter.name === 'El Primo') {
                            damage = 400;
                        }
                        if (selectedCharacter.name === 'Jessie') {
                            damage = 1000;
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

// (Game loop, victo
