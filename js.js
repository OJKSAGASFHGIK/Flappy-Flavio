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

let gameStarted = false;
let gameOver = false;
let score = 0;

// DOM elements (now existing in HTML)
let startButton;
let gameOverWindow;
let restartButton;

// ----- Helper functions for UI (no creation, just selection & visibility) -----
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

    // Get existing UI elements from HTML
    startButton = document.getElementById("startBtn");
    gameOverWindow = document.getElementById("gameOverWindow");
    restartButton = document.getElementById("restartBtn");

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
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
        context.fillStyle = "white";
        context.font = "24px monospace";
        context.fillText("", board.width / 2 - 80, board.height / 2 + 50);
        return;
    }

    // If game over, freeze the canvas (don't update anything)
    if (gameOver) return;

    // Game active: update everything
    context.clearRect(0, 0, board.width, board.height);

    // Bird physics
    velocityY += gravity;
    bird.y += velocityY;
    if (bird.y < 0) bird.y = 0;

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