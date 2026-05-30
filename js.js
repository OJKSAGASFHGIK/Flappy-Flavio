// board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

// bird
let birdWidth = 34;
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight,
};

// poop (drops when bird jumps)
let poopWidth = 20;
let poopHeight = 20;
let poopVelocityY = 0;
let poopGravity = 0.3;
let poopImg;
let poop = {
    active: false,
    x: 0,
    y: 0,
    width: poopWidth,
    height: poopHeight,
};

// pipes
let pipeArray = [];
let pipeX = boardWidth;
let pipeY = 0;
let pipeWidth = 64;
let pipeHeight = 512;

let topPipeImg;
let bottomPipeImg;

// physics
let velocityX = -2;
let velocityY = 0;
let gravity = 0.4;

let gameStarted = false;   // NEW: whether the game has started (start button clicked)
let gameOver = false;
let score = 0;

// DOM elements (dynamically created)
let startButton;
let gameOverWindow;
let restartButton;

// ----- Helper functions for UI -----
function createUI() {
    // Style injected for buttons and overlay
    const style = document.createElement('style');
    style.textContent = `
        .flappy-start-btn {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f5c542;
            color: #2c1a0c;
            border: none;
            font-size: 28px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            padding: 12px 28px;
            border-radius: 60px;
            cursor: pointer;
            box-shadow: 0 6px 0 #a05e15;
            transition: 0.05s linear;
            z-index: 20;
        }
        .flappy-start-btn:active {
            transform: translate(-50%, -44%);
            box-shadow: 0 2px 0 #a05e15;
        }
        .gameover-window {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 260px;
            background: #1e1910e6;
            backdrop-filter: blur(8px);
            border: 3px solid #ffc857;
            border-radius: 48px;
            padding: 18px 14px 28px;
            text-align: center;
            z-index: 30;
            box-shadow: 0 20px 30px rgba(0,0,0,0.5);
            font-family: monospace;
        }
        .gameover-window h2 {
            font-size: 26px;
            margin: 0 0 12px;
            color: #ffd966;
        }
        .gameover-window p {
            color: #fbe9c3;
            font-size: 18px;
            margin: 8px 0;
        }
        .restart-btn {
            background: #56ab2f;
            border: none;
            font-size: 22px;
            font-weight: bold;
            font-family: monospace;
            padding: 6px 20px;
            margin-top: 12px;
            border-radius: 40px;
            color: white;
            cursor: pointer;
            box-shadow: 0 5px 0 #2c6e1a;
            transition: 0.05s linear;
        }
        .restart-btn:active {
            transform: translateY(3px);
            box-shadow: 0 2px 0 #2c6e1a;
        }
        .hide {
            display: none;
        }
    `;
    document.head.appendChild(style);

    // Create start button
    startButton = document.createElement('button');
    startButton.textContent = '🚀 START';
    startButton.className = 'flappy-start-btn';
    document.body.appendChild(startButton);

    // Create game over window
    gameOverWindow = document.createElement('div');
    gameOverWindow.className = 'gameover-window hide';
    gameOverWindow.innerHTML = `
        <h2>💩 GAME OVER</h2>
        <p>Flavio se cagou...</p>
        <button class="restart-btn">🔄 RESTART</button>
    `;
    document.body.appendChild(gameOverWindow);
    restartButton = gameOverWindow.querySelector('.restart-btn');

    // Position canvas relative for absolute positioning of buttons
    board.style.position = 'relative';
    document.body.style.position = 'relative';
}

function showStartButton() {
    startButton.classList.remove('hide');
}

function hideStartButton() {
    startButton.classList.add('hide');
}

function showGameOverWindow() {
    gameOverWindow.classList.remove('hide');
}

function hideGameOverWindow() {
    gameOverWindow.classList.add('hide');
}

// ----- Game flow functions -----
function resetGameWorld() {
    bird.y = birdY;
    velocityY = 0;
    pipeArray = [];
    score = 0;
    poop.active = false;
    poopVelocityY = 0;
}

function startGame() {
    if (gameStarted) return;
    resetGameWorld();
    gameStarted = true;
    gameOver = false;
    hideStartButton();
    hideGameOverWindow();
}

function restartGame() {
    resetGameWorld();
    gameStarted = true;
    gameOver = false;
    hideGameOverWindow();
    hideStartButton();
}

function endGame() {
    if (!gameStarted || gameOver) return;
    gameOver = true;
    showGameOverWindow();
}

// ----- Original game functions (modified) -----
window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Create UI (start button & game over window)
    createUI();

    // Load images
    birdImg = new Image();
    birdImg.src = "./memeAssets/image/flappybird.png";

    poopImg = new Image();
    poopImg.src = "./memeAssets/image/poop.png";

    topPipeImg = new Image();
    topPipeImg.src = "./memeAssets/image/toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./memeAssets/image/bottompipe.png";

    // Event listeners
    document.addEventListener("keydown", handleGlobalKeys);
    startButton.addEventListener("click", startGame);
    restartButton.addEventListener("click", restartGame);

    requestAnimationFrame(update);
    setInterval(placePipes, 1500);
};

function handleGlobalKeys(e) {
    const key = e.code;
    if (key === "Space" || key === "ArrowUp" || key === "KeyW") {
        e.preventDefault();

        // Case: game not started -> start
        if (!gameStarted) {
            startGame();
            return;
        }
        // Case: game over -> restart
        if (gameStarted && gameOver) {
            restartGame();
            return;
        }
        // Case: game running -> jump
        if (gameStarted && !gameOver) {
            performJump();
        }
    }
}

function performJump() {
    velocityY = -6;

    // Drop poop
    poop.active = true;
    poop.x = bird.x + bird.width / 4;
    poop.y = bird.y + bird.height;
    poopVelocityY = 1;

    // Play random jump sound
    const rIndex = Math.floor(Math.random() * jumpSounds.length);
    const jumpSound = jumpSounds[rIndex];
    jumpSound.currentTime = 0;
    jumpSound.volume = 0.1;
    jumpSound.play();
}

let jumpSounds = [
    new Audio("./memeAssets/audio/sfx_wing.mp3"),
    new Audio("./memeAssets/audio/sfx_wing2.mp3"),
    new Audio("./memeAssets/audio/sfx_wing3.mp3"),
];

function update() {
    requestAnimationFrame(update);

    // If game not started, draw static scene + start hint
    if (!gameStarted) {
        context.clearRect(0, 0, board.width, board.height);
        // Draw idle bird
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
        context.fillStyle = "white";
        context.font = "24px monospace";
        context.fillText("PRESS START", board.width / 2 - 80, board.height / 2 + 50);
        return;
    }

    // If game over, freeze the canvas (don't update anything)
    if (gameOver) {
        return;
    }

    // Game active: update everything
    context.clearRect(0, 0, board.width, board.height);

    // Bird physics
    velocityY += gravity;
    bird.y += velocityY;
    if (bird.y < 0) bird.y = 0;

    // Draw bird
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    // Poop logic
    if (poop.active) {
        poopVelocityY += poopGravity;
        poop.y += poopVelocityY;
        context.drawImage(poopImg, poop.x, poop.y, poop.width, poop.height);
        if (poop.y > board.height) poop.active = false;
    }

    // Pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            endGame();
            return;
        }
    }

    // Remove offscreen pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    // Boundary collision (top/bottom)
    if (bird.y + bird.height >= board.height || bird.y <= 0) {
        endGame();
        return;
    }

    // Score display
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(Math.floor(score), 5, 45);
}

function placePipes() {
    // Only place pipes if game active and not over
    if (!gameStarted || gameOver) return;

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
    };
    pipeArray.push(topPipe);

    let openingSpace = board.height / 4;
    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
    };
    pipeArray.push(bottomPipe);
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}