var gameCanvas, gameContext;
var statsPanel;

var lives = 5;
var inGame = false;

//mouse positions
var mouseX, mouseY;

//images, we don't put them in the draw function because will lag due to always loading a new image.
var scopeImage;
var bubbleImage;
var backgroundImage;
var startButtonImage;

//buttons
var startButton;

//list of bubbles on the screen
var bubbles = [];

//Ids of setIntervals, used to clear them to prevent "memory leaks"
var bubbleMakerId;
var enter_frameId;

/*
 * Represents a bubble.
 * Need to specify x, y, hitsRequired, speed
 */
function Bubble(I) {
	I.xVelocity = 0;
	I.yVelocity = -I.speed;

	I.isAtTop = function() {
		return I.y <= 0;
	}
	
	I.inBounds = function() {
		return I.x >= 0 				&& 
			   I.x <= gameCanvas.width 	&&
			   I.y >= 0 				&& 
			   I.y <= gameCanvas.height;
	};

	I.update = function() {
		I.x += I.xVelocity;
		I.y += I.yVelocity;
	};

	I.draw = function() {
		drawImageInCenter(bubbleImage, this.x, this.y);
	};

	I.isActive = function() {
		return I.hitsRequired > 0 && I.inBounds();
	}
	
	I.hit = function(numTimesHit) {
		I.hitsRequired -= numTimesHit;
	}
	
	//determines if a point is inside the bubble
	I.isInsideBubble = function(pointX, pointY) {
		return Math.pow(pointX - this.x, 2) + Math.pow(pointY - this.y, 2) <= Math.pow(bubbleImage.width/2, 2);
	}

	return I;
}

//need to pass in x, y, image
function Button(I) {
	I.isInsideButton = function(pointX, pointY) {
		return  this.isActive()						&&
				I.x - I.image.width <= pointX 	&&
				I.x + I.image.width >= pointX 	&&
				I.y - I.image.height <= pointY 	&&
				I.y + I.image.height >= pointY;
	}
	
	I.isActive = function() {
		return ! inGame;
	}
	return I;
}

function initOnPageLoad() {

//	gameCanvas = document.getElementById('gameCanvas');
//	gameContext = gameCanvas.getContext("2d");
//	statsPanel = document.getElementById('statsPanel');
	gameCanvas = $("#gameCanvas")[0];
	gameContext = gameCanvas.getContext('2d');
	statsPanel = $("#statsPanel")[0];
	
	window.addEventListener('resize', resizeGame, false);
	window.addEventListener('orientationchange', resizeGame, false);
	
	//get rid of the cursor when the mouse is dragged on the canvas
	$("#gameCanvas").mousedown(function(event){
	    event.preventDefault();
	});
	
	initImages();
	initButtons();
	initMouseEvents();
	resizeGame();//need to resize at the beginning..
	
	var FPS = 30;//frames per second
	enterFrameId = setInterval(function() {
		enter_frame();
	}, 1000 / FPS);
}

function stopFrames() {
	clearInterval(enterFrameId);
}

function initImages() {
	scopeImage = new Image();
//	scopeImage.src = "img/chainsaw.gif";
	scopeImage.src = "img/scope.gif";
	
	bubbleImage = new Image();
//	bubbleImage.src = "img/eric.png";
	bubbleImage.src = "img/blue_bubble2.gif";
	
	backgroundImage = new Image();
	backgroundImage.src = "img/volcano.jpg";
	
	startButtonImage = new Image();
	startButtonImage.src = "img/sampleIcon.jpg"
}

function initButtons() {
	startButton = Button({
		x : gameCanvas.width/2,
		y : gameCanvas.height/2,
		image: startButtonImage
	});
	
}

function initMouseEvents() {
	gameCanvas.addEventListener("mousemove", move);
	gameCanvas.addEventListener("mousedown", down);
}

function newGame() {
	lives = 5;
	inGame = true;
	gameCanvas.style.cursor = "none";
	createBubbles(4);
	startBubbleMaker();
}

/*
 * Make bubbles constantly
 */
function startBubbleMaker() {
	var numSec = .8;
	bubbleMakerId = setInterval(function() {
		createBubble();
	}, numSec * 1000);
}

function stopBubbleMaker() {
	clearInterval(bubbleMakerId);
}

function createBubble() {
	createBubbles(1);
}

function createBubbles(num) {
	for ( var i = 0; i < num; i++) {
		var xStart = Math.random() * (gameCanvas.width - bubbleImage.width) + bubbleImage.width/2;
		
		// the bubbleImage width may be 0 since it is not loaded yet,
		// so just put it in the middle for now
		if (bubbleImage.width == 0) {
			xStart = Math.random() * gameCanvas.width/2 + gameCanvas.width/4;
		}
		
		var bubble = Bubble({
			speed : 4,
			hitsRequired : 1,
			x : xStart,
			y : gameCanvas.height * .92
		});
		
		bubbles.push(bubble);
	}
}

/*
* When the browser is resized, the game is resized as well.
*/
function resizeGame() {
    var gameArea = document.getElementById('gameArea');
    var widthToHeight = 4 / 3;
    var newWidth = window.innerWidth;
    var newHeight = window.innerHeight;
    var newWidthToHeight = newWidth / newHeight;
    
    if (newWidthToHeight > widthToHeight) {
        newWidth = newHeight * widthToHeight;
        gameArea.style.height = newHeight + 'px';
        gameArea.style.width = newWidth + 'px';
    } else {
        newHeight = newWidth / widthToHeight;
        gameArea.style.width = newWidth + 'px';
        gameArea.style.height = newHeight + 'px';
    }
    
    gameArea.style.marginTop = (-newHeight / 2) + 'px';
    gameArea.style.marginLeft = (-newWidth / 2) + 'px';
    
    gameCanvas.width = newWidth;
    gameCanvas.height = newHeight;
    initButtons();
}

//mouse events
function move(mouseEvent) {
	mouseX = mouseEvent.offsetX;
	mouseY = mouseEvent.offsetY;
}

function down(mouseEvent) {
	bubbles.forEach(function(bubble) {
		if (bubble.isInsideBubble(mouseX, mouseY)) {
			bubble.hit();
		}
	});
	
	if (startButton.isInsideButton(mouseX, mouseY)) {
		newGame();
	}
}
//end mouse events

function loseLife() {
	lives--;
	if (lives <= 0) {
		endGame();
	}
}

//end the game, show statistics and button to play again.
function endGame() {
	inGame = false;
	stopBubbleMaker();
	bubbles = [];
}

function showMenu() {
	clearGameCanvas();
	gameContext.drawImage(backgroundImage, 0, 0);
	drawImageInCenter(startButtonImage, gameCanvas.width/2, gameCanvas.height/2);
}

function drawImageInCenter(img, x, y) {
	gameContext.drawImage(img, x - img.width/2, y - img.height/2);
}

function clearGameCanvas() {
	gameCanvas.width = gameCanvas.width;
}

function enter_frame() {
	update();
	draw();
}

//updates the logic/positions of objects
function update() {
	//update each bubble
	bubbles.forEach(function(bubble) {
		bubble.update();
		if (bubble.isAtTop()) {
			loseLife();
		}
	});
	
	//get rid of non active bubbles
	bubbles = bubbles.filter(function(bubble) {
		return bubble.isActive();
	});
}

//draws the objects onto the canvas
function draw() {
	
//	if ( ! inGame) {
//		newGame();
//	}
	if ( ! inGame) {
    	showMenu();
    } else {
    	clearGameCanvas();
    	gameContext.drawImage(backgroundImage, 0, 0);

    	bubbles.forEach(function(bubble) {
    		bubble.draw();
    	});
    }
	drawImageInCenter(scopeImage, mouseX, mouseY);
}

























