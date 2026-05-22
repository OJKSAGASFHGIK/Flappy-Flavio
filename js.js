// board
let board
let boardWidth = 360;
let boardHeight = 640;
let context;

// bird
let birdWidth = 34;
let birdHeight = 24;
let birdX = boardWidth/8;
let birdY = boardHeight/2;

let bird = {
    x: birdX, // bird.x,
    y: birdY, // bird.y,
    width: birdWidth, // bird.width,
    height: birdHeight, // bird.height,
} // dict

// poop (drops when bird jumps)
let poopWidth = 20;
let poopHeight = 20;
let poopVelocityY = 0;
let poopGravity = 0.3; // poop drops faster
let poopImg;
let poop = {
    active: false,
    x: 0,
    y: 0,
    width: poopWidth,
    height: poopHeight
};

// pipes
let pipeArray = [];
let pipeX = boardWidth;
let pipeY = 0;
let pipeWidth = 64; // width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;

let topPipeImg;
let bottomPipeImg;

// physics
let velocityX = -2; // pipes moving left speed
let velocityY = 0; // bird jump speed
let gravity = 0.4; // bird drops

let gameOver = false;
let score = 0;

window.onload = function(){
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); // used for drawing on the board

    // flappy bird hitbox
/*     context.fillStyle = "red";
    context.fillRect(bird.x, bird.y, bird.width, bird.height); // accessing bird dict
 */
    // load images
    birdImg = new Image(); // birdImg.src = "path";
    birdImg.src = "./memeAssets/image/flappybird.png";
    birdImg.onload = function(){
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    }

    poopImg = new Image();
    poopImg.src = "./memeAssets/image/poop.png"; // Replace with your poop image path

    topPipeImg = new Image();
    topPipeImg.src = "./assets/image/toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./assets/image/bottompipe.png";

    requestAnimationFrame(update);
    setInterval(placePipes, 1500); // every 1.5 seconds
    document.addEventListener("keydown", moveBird); // bird jump
}

function update(){
    requestAnimationFrame(update);
    if (gameOver){ return; }
    context.clearRect(0, 0, board.width, board.height);

    // bird
    // bird.y += velocityY; // bird jump
    velocityY += gravity; // bird drops
    bird.y = Math.max(bird.y + velocityY, 0); // max window to the bird
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if(bird.y > board.height){ gameOver = true; }

    // poop logic
    if (poop.active) {
        poopVelocityY += poopGravity; // poop falls
        poop.y += poopVelocityY;
        context.drawImage(poopImg, poop.x, poop.y, poop.width, poop.height);

        // Deactivate poop if it goes off screen
        if (poop.y > board.height) {
            poop.active = false;
        }
    }

    // pipes
    for (let i = 0; i < pipeArray.length; i++){
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width){
            score += 0.5;
            pipe.passed = true;
        };

        if (detectCollision(bird, pipe)){
            gameOver = true;
        }
    };

    // clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth){
        pipeArray.shift(); // remove pipes
    }

    // score
    context.fillStyle = "white";
    context.font = "45px sans-seriff";
    context.fillText(score, 5, 45);

    if (gameOver){
        context.fillText("Flavio se cagou...", 1, 90);
    }
}

function placePipes(){
    if (gameOver){ return; }

    let randomPipeY = pipeY-pipeHeight/4 - Math.random()*(pipeHeight/2);
    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
    }
    pipeArray.push(topPipe);

    let openingSpace = board.height/4;
    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY+pipeHeight+openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
    }
    pipeArray.push(bottomPipe);
}

let jumpSounds = [
    new Audio("./memeAssets/audio/sfx_wing.mp3"),
    new Audio("./memeAssets/audio/sfx_wing2.mp3"),
    new Audio("./memeAssets/audio/sfx_wing3.mp3")
]
function moveBird(e){
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyW"){
        velocityY = -6; // jump

        // Create the poop object when the bird jumps
        poop.active = true;
        poop.x = bird.x + bird.width / 4; // Start near the bird
        poop.y = bird.y + bird.height;
        poopVelocityY = 1; // Give it a little initial downward push

        // jumpSounds jumpSound
        const rIndex = Math.floor(Math.random() * jumpSounds.length);
        const jumpSound = jumpSounds[rIndex];

        jumpSound.currentTime = 0;
        jumpSound.volume = 0.1;
        jumpSound.play();
    }

    if (gameOver){
        bird.y = birdY;
        pipeArray = [];
        poop.active = false; // clear poop on game reset
        score = 0;
        gameOver = false;
    }
}

function detectCollision(a, b){
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}