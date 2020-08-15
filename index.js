//Global Variables so all the code can run it but it is not given any values outside the main function
let cdx, ctx;
let width, height;
let board, hand;
let tiles = [];
let turn, jumpAgain;

//Runs when the page fully loads
function main() {
	//creates a variable for the canvas and gets it ready to be drawable
	cdx = document.getElementById("screen");
	ctx = cdx.getContext("2d");

	//creates event listeners for resizing the window and when you click on the canvas
	window.addEventListener("resize", resizeWindow);
	cdx.addEventListener("click", screenClicked);

	//creates variables for the width and height of the window
	width = window.innerWidth;
	height = window.innerHeight;

	//changes the size of the canvas to the full size off the window
	cdx.width = width;
	cdx.height = height;

	//assigned new objects to the global variables
	board = new Board();
	hand = new Hand();
	//sets turn to the red (red is true)
	turn = true;
	//set false until you can double or triple jumps
	jumpAgain = false;

	//loops through the board to create tile object in array
	for (let xVal = 0; xVal < 8; xVal++) {
		//will create a 2d array
		tiles[xVal] = [];
		for (let yVal = 0; yVal < 8; yVal++) {
			//assigned the new tile objects to the 2d array with the x and y values from the array
			tiles[xVal][yVal] = new Tile(xVal, yVal);

			//this creates the checker pattern, every other tile and every other row will become a working tile
			if (xVal % 2 == 1 && yVal % 2 == 0) {
				tiles[xVal][yVal].deadSpace = true; //0#0#0#0#0
			}
			if (xVal % 2 == 0 && yVal % 2 == 1) {
				tiles[xVal][yVal].deadSpace = true; //#0#0#0#0#
			}

			//sets red and black pieces depending on the y value
			if (yVal < 3 && tiles[xVal][yVal].deadSpace) {
				tiles[xVal][yVal].chip = true; //if a chip in on the tile
				tiles[xVal][yVal].chipColor = true; //what color the chip is (red is true)
				tiles[xVal][yVal].chipKing = false; //if the chip is a king
				tiles[xVal][yVal].chipDir = 1; //which direction the chip will be going on the y Value (positive is down)
			}
			if (yVal >= 5 && tiles[xVal][yVal].deadSpace) {
				tiles[xVal][yVal].chip = true;
				tiles[xVal][yVal].chipColor = false;
				tiles[xVal][yVal].chipKing = false;
				tiles[xVal][yVal].chipDir = -1;
			}
		}
	}

	// calls the draw function
	draw();
}

//this function will control what is displayed and in what order it will be drawn
function draw() {
	//checks whose turn it is and will color the back ground accordingly
	if (turn) {
		ctx.fillStyle = "crimson"; //changes the fillColor to "crimson"
		ctx.fillRect(0, 0, width, height); //fills a rectangle from 0,0 with a width and height of the whole screen
	} else {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, width, height);
	}

	//the board object has a draw method and it is being called
	board.draw();

	//loops through all the tiles in the 2d array and calls their draw method
	for (let xVal = 0; xVal < 8; xVal++) {
		for (let yVal = 0; yVal < 8; yVal++) {
			tiles[xVal][yVal].draw();
		}
	}

	//calls the hand's draw method
	hand.draw();
}

//small function that will be called to go to the next turn and reset everything that needs to be reset such as the hand
function nextTurn() {
	//switched the turn
	if (turn) {
		turn = false;
	} else {
		turn = true;
	}

	//resets the hand to a invalid position and changes if its highlighting to false
	hand.resetHand();

	//resets jump again to false to end double jump
	jumpAgain = false;

	//will draw this new background and will stop displaying the hand
	draw();
}

//when the window is resized this function is called and the sizes of the board and pieces will change accordingly
function resizeWindow() {
	//resets default sizes
	width = window.innerWidth;
	height = window.innerHeight;
	cdx.width = width;
	cdx.height = height;

	//will create a new board object to reset its default sizes (kinda a cheaty way to do that)
	board = new Board();

	//will draw this new board
	draw();
}

//when the canvas is clicked this function will be called
function screenClicked(event) {
	//gets the x and y position of the users click and sets them as variables
	let xPos = event.x;
	let yPos = event.y;

	//checks if that click is inside the board
	if (xPos > board.Hoffset && xPos < board.Hoffset + board.size) {
		if (yPos > board.Voffset && yPos < board.Voffset + board.size) {
			//if it is in the board will calculate which tile it is on using math
			let xTile = Math.floor((xPos - board.Hoffset) / (board.size / 8));
			let yTile = Math.floor((yPos - board.Voffset) / (board.size / 8));

			//this will let us check if we have clicked on a move
			let moveCheck = false;

			//this will loop through our possible moves to see if we have clicked on any and it will preform those moves if we have
			for (let moveInt = 0; moveInt < hand.possibleMoves.length; moveInt++) {
				//this is checking the x and y values of those moves in conjunction with the cursor moves
				if (hand.possibleMoves[moveInt].x == xTile && hand.possibleMoves[moveInt].y == yTile) {
					//since we did click on a move it will set move check to true
					moveCheck = true;

					//this will get the new coordinates that the chip will end up
					let newX = hand.possibleMoves[moveInt].x;
					let newY = hand.possibleMoves[moveInt].y;

					//this is getting the chips information
					let chipColor = tiles[hand.xPos][hand.yPos].chipColor;
					let chipKing = tiles[hand.xPos][hand.yPos].chipKing;
					let chipDir = tiles[hand.xPos][hand.yPos].chipDir;

					//this is checking if the type of move is a "move" or a "jump"
					if (hand.possibleMoves[moveInt].type == "move") {
						//it will create a new chip and delete the old chip
						makeChip(newX, newY, chipColor, chipKing, chipDir);
						deleteChip(hand.xPos, hand.yPos);

						//this checks if the chip is at the end of the board to change into a king
						if (tiles[newX][newY].chipDir == -1 && newY == 0) {
							tiles[newX][newY].chipKing = true;
						}
						if (tiles[newX][newY].chipDir == 1 && newY == 7) {
							tiles[newX][newY].chipKing = true;
						}

						//on "move" moves you can only preform one in a row at the end of your turn
						nextTurn();
					} else if (hand.possibleMoves[moveInt].type == "jump") {
						//this will create a new chip delete the old chip, and it will delete the chip that was just jumped over
						makeChip(newX, newY, chipColor, chipKing, chipDir);
						deleteChip(hand.xPos, hand.yPos);
						deleteChip(hand.possibleMoves[moveInt].x2, hand.possibleMoves[moveInt].y2);

						//checks if the chip is at the end of the board and will king it
						if (tiles[newX][newY].chipDir == -1 && newY == 0) {
							tiles[newX][newY].chipKing = true;
						}
						if (tiles[newX][newY].chipDir == 1 && newY == 7) {
							tiles[newX][newY].chipKing = true;
						}

						//it will set jump again to true then it will check if you really can jump again or if your turn has ended
						jumpAgain = true;

						//resets hand and places it on the new board location
						hand.resetHand();
						hand.xPos = newX;
						hand.yPos = newY;
						hand.highlight = true;
						hand.checkAllMoves();

						//if there are no jump moves left on that particular piece then it will end your turn
						if (hand.possibleMoves.length == 0) {
							nextTurn();
						}
					}
				}
			}

			//if you haven't clicked on a move and if you are not locked into jumping again it will let you click on a new piece
			if (!moveCheck && !jumpAgain) {
				//it will then check if that tile is a good tile with a chip and it is that colors turn
				if (tiles[xTile][yTile].deadSpace && tiles[xTile][yTile].chip && tiles[xTile][yTile].chipColor == turn) {
					//if all those conditions are true then it will check if the hand has moved at all
					if (hand.xPos != xTile || hand.yPos != yTile) {
						//if it has it will set the new x and y and will highlight that tile
						hand.resetHand();
						hand.xPos = xTile;
						hand.yPos = yTile;
						hand.highlight = true;
						hand.checkAllMoves();
					} else {
						//if the hand has not moved it will reset it
						hand.resetHand();
					}
					//if it is not their turn it will reset the hand
				} else {
					hand.resetHand();
				}
			}
		}
	}

	//it will then draw these new hand highlighting
	draw();
}

//this function lets you make a chip on the board
function makeChip(xIn, yIn, colorIn, kingIn, dirIn) {
	//sets all values needed for chips
	tiles[xIn][yIn].chip = true;
	tiles[xIn][yIn].chipColor = colorIn;
	tiles[xIn][yIn].chipDir = dirIn;
	tiles[xIn][yIn].chipKing = kingIn;

	//then draws new board state
	draw();
}

//this function deletes the chip off the board
function deleteChip(xIn, yIn) {
	//changing chip to false will tell the board there is no chip there
	tiles[xIn][yIn].chip = false;

	//then draws the new state of the board
	draw();
}

//this function will check the possible regular moves a chip can do (not king moves)
function checkMoveMoves(xIn, yIn) {
	//since there are two possible moves you could do you need an array to hold those moves
	let possibleMoves = [];

	//it checks to see if the tile actually has a chip
	if (tiles[xIn][yIn].chip) {
		//it then gets the direction that chip is going
		let dir = tiles[xIn][yIn].chipDir;

		//it then makes sure the chip isn't by the edge of the board
		//this will break the code if you check in a space that does not exist(edge case)
		if (xIn - 1 >= 0 && yIn + dir < 8 && yIn + dir >= 0) {
			//it then checks if the spot to the left of the chip is open
			if (!tiles[xIn - 1][yIn + dir].chip) {
				//if it is it will create a custom object with the new space's coords and the type "move" and puts it in the possible moves array
				possibleMoves.push({ x: xIn - 1, y: yIn + dir, type: "move" });
			}
		}

		//checks edge cases
		if (xIn + 1 < 8 && yIn + dir < 8 && yIn + dir >= 0) {
			//checks if the space to the right of the piece is open
			if (!tiles[xIn + 1][yIn + dir].chip) {
				//pushes the object with the info into the array
				possibleMoves.push({ x: xIn + 1, y: yIn + dir, type: "move" });
			}
		}
	}

	//it will then return the possible regular moves that chip can make
	return possibleMoves;
}

//this function checks to see which regular jump moves the piece can make(not king jumps)
function checkJumpMoves(xIn, yIn) {
	//creates an array to hold the move objects
	let possibleMoves = [];

	//checks if the tile the chip is on has a chip
	if (tiles[xIn][yIn].chip) {
		//gets the direction the chip is going
		let dir = tiles[xIn][yIn].chipDir;

		//checks the edge cases to not cause an error
		if (xIn - 1 >= 0 && yIn + dir < 8 && xIn - 2 >= 0 && yIn + 2 * dir < 8 && yIn + dir >= 0 && yIn + 2 * dir >= 0) {
			//it then checks if the next space has a chip of the opposite color and that there is in fact a chip there
			if (tiles[xIn - 1][yIn + dir].chipColor != tiles[xIn][yIn].chipColor && tiles[xIn - 1][yIn + dir].chip) {
				//it then checks if the space two over has no chip
				if (!tiles[xIn - 2][yIn + 2 * dir].chip) {
					//if all criteria are met it will push a different object that has the new location, the "jump" tag, and the location of the jumped piece
					possibleMoves.push({
						x: xIn - 2, //new location of chip
						y: yIn + 2 * dir,
						type: "jump",
						x2: xIn - 1, //location of jumped chip
						y2: yIn + dir,
					});
				}
			}
		}

		//checks edge cases
		if (xIn + 1 < 8 && yIn + dir < 8 && xIn + 2 < 8 && yIn + 2 * dir < 8 && yIn + dir >= 0 && yIn + 2 * dir >= 0) {
			//checks if the next space has a chip and its the opposite color
			if (tiles[xIn + 1][yIn + dir].chipColor != tiles[xIn][yIn].chipColor && tiles[xIn + 1][yIn + dir].chip) {
				//checks if the space two over has no chip
				if (!tiles[xIn + 2][yIn + 2 * dir].chip) {
					//push jump object into array
					possibleMoves.push({ x: xIn + 2, y: yIn + 2 * dir, type: "jump", x2: xIn + 1, y2: yIn + dir });
				}
			}
		}
	}

	//returns all possible jump moves
	return possibleMoves;
}

//this function checks all special moves that only king chips can make
function checkKingMoves(xIn, yIn) {
	//sets up an array to hold the possible king moves
	let possibleMoves = [];

	//checks if the tile has a chip and its a king
	if (tiles[xIn][yIn].chip && tiles[xIn][yIn].chipKing) {
		//gets the direction the piece is going
		let dir = tiles[xIn][yIn].chipDir;

		//check the edge cases
		if (xIn - 1 >= 0 && yIn - dir >= 0 && yIn - dir < 8) {
			//checks if the tile going the other direction has no chip
			if (!tiles[xIn - 1][yIn - dir].chip) {
				//creates a regular move object with the new space's coords
				possibleMoves.push({ x: xIn - 1, y: yIn - dir, type: "move" });
			}
		}

		//checks edge cases
		if (xIn + 1 < 8 && yIn - dir >= 0 && yIn - dir < 8) {
			//checks if the tile going the other direction has no chip
			if (!tiles[xIn + 1][yIn - dir].chip) {
				//pushes move object into array
				possibleMoves.push({ x: xIn + 1, y: yIn - dir, type: "move" });
			}
		}
	}

	//return all possible king moves that can be made
	return possibleMoves;
}

//this function checks all king jump moves that can be made
function checkKingJumps(xIn, yIn) {
	//sets up array for all possible king jump moves
	let possibleMoves = [];

	//check to make sure the tile has a chip and it is a king
	if (tiles[xIn][yIn].chip && tiles[xIn][yIn].chipKing) {
		//gets the direction the chip is going
		let dir = tiles[xIn][yIn].chipDir;

		//checks edge cases
		if (xIn - 1 >= 0 && yIn - dir >= 0 && xIn - 2 >= 0 && yIn - 2 * dir >= 0 && yIn - dir < 8 && yIn - 2 * dir < 8) {
			//checks to see if the tile going the other direction has a chip and it is the opposite color
			if (tiles[xIn - 1][yIn - dir].chipColor != tiles[xIn][yIn].chipColor && tiles[xIn - 1][yIn - dir].chip) {
				//checks if the next space the other direction has no chip
				if (!tiles[xIn - 2][yIn - 2 * dir].chip) {
					//it then pushes a jump object with the new coords and the coords of the piece that was just jumped
					possibleMoves.push({
						x: xIn - 2, //new coords
						y: yIn - 2 * dir,
						type: "jump",
						x2: xIn - 1, //piece that was jumped coords
						y2: yIn - dir,
					});
				}
			}
		}

		//checks edge cases
		if (xIn + 1 < 8 && yIn - dir >= 0 && xIn + 2 < 8 && yIn - 2 * dir >= 0 && yIn - dir < 8 && yIn - 2 * dir < 8) {
			//checks if the tile going the other direction has a chip and its the opposite color
			if (tiles[xIn + 1][yIn - dir].chipColor != tiles[xIn][yIn].chipColor && tiles[xIn + 1][yIn - dir].chip) {
				//checks if the next space in the other direction has a chip
				if (!tiles[xIn + 2][yIn - 2 * dir].chip) {
					//then pushes the jump object into the array
					possibleMoves.push({ x: xIn + 2, y: yIn - 2 * dir, type: "jump", x2: xIn + 1, y2: yIn - dir });
				}
			}
		}
	}

	//return all possible king jump moves
	return possibleMoves;
}

//this is the hand object declaration
class Hand {
	constructor() {
		//these are the default values for the hand
		this.xPos = -1;
		this.yPos = -1;
		this.width = board.size / 8; //this is the size of the tiles
		this.height = board.size / 8;
		this.highlight = false; //this controls if the highlight is on or off

		//this will store possible moves that chip can make
		this.possibleMoves = [];

		//these are the colors of the highlights
		this.colorHand = "yellow";
		this.colorMoves = "skyblue";

		//this is a method that will reset the hand to its default settings
		this.resetHand = function () {
			this.xPos = -1;
			this.yPos = -1;
			this.highlight = false;
			this.possibleMoves = [];
		};

		//this is method to check all the possible move types and place their return values in to the possibleMoves array
		this.checkAllMoves = function () {
			//if jump again is true then you are not able to make any move moves
			if (!jumpAgain) {
				//this will set the possibleMoves as a concatenation of the previous possibleMoves and the return values
				this.possibleMoves = this.possibleMoves.concat(checkMoveMoves(hand.xPos, hand.yPos));
				this.possibleMoves = this.possibleMoves.concat(checkKingMoves(hand.xPos, hand.yPos));
			}

			//this will set the possibleMoves as a concatenation of the previous possibleMoves and the return values
			this.possibleMoves = this.possibleMoves.concat(checkJumpMoves(hand.xPos, hand.yPos));
			this.possibleMoves = this.possibleMoves.concat(checkKingJumps(hand.xPos, hand.yPos));
		};

		//this draw function will draw the highlight when called
		this.draw = function () {
			//it checks if the highlight is on
			if (this.highlight) {
				//then it resets the size of the highlight incase the window was resized
				this.width = board.size / 8;
				this.height = board.size / 8;

				//then it makes the color a little see through
				ctx.globalAlpha = 0.5;

				//it will fill the the rectangle based on its position and the offset of the board
				ctx.fillStyle = this.colorHand;
				ctx.fillRect(this.xPos * this.width + board.Hoffset, this.yPos * this.height + board.Voffset, this.width, this.height);

				//this loops through all the possible moves and will draw their highlights
				for (let movesInt = 0; movesInt < this.possibleMoves.length; movesInt++) {
					ctx.fillStyle = this.colorMoves;
					ctx.fillRect(
						this.possibleMoves[movesInt].x * this.width + board.Hoffset,
						this.possibleMoves[movesInt].y * this.height + board.Voffset,
						this.width,
						this.height
					);
				}

				//it will then reset the global alpha
				ctx.globalAlpha = 1;
			}
		};
	}
}

//this is the board object declaration
class Board {
	constructor() {
		//these are the default values
		this.size = 0;
		this.Voffset = 0;
		this.Hoffset = 0;
		this.color = "tan";

		//when the object is created this code will run to size and place the board correctly
		if (width > height) {
			//if the height is smaller than the width it will create a square based on that height
			this.size = height;

			//it will the find the correct offsets to center it in the middle of the screen
			this.Hoffset = width / 2 - height / 2;
		} else if (width < height) {
			this.size = width;
			this.Voffset = height / 2 - width / 2;
		} else {
			//if it is a square no offset is necessary and the default value of zero will remain unchanged
			this.size = width;
		}

		//the draw method will just draw a normal rectangle
		this.draw = function () {
			ctx.fillStyle = this.color;
			ctx.fillRect(this.Hoffset, this.Voffset, this.size, this.size);
		};
	}
}

//this is the tile object which takes in the x and y values as arguments

class Tile {
	constructor(xIn, yIn) {
		//here are the default values
		this.deadSpace = false; //dead space is kinda a backwards name because if its true that means it is a real space that chips can go on
		this.size = board.size / 8; //size of the tiles on board
		this.xPos = xIn; //uses those arguments and sets them as property
		this.yPos = yIn;

		//these are all the colors in one spot so its easy to change them throughout the draw method
		this.color = "saddlebrown";
		this.redChipColors = ["firebrick", "darkred"];
		this.blackChipColors = ["darkslategrey", "#1d3030"];
		this.kingColors = ["gold", "yellow"];

		//these are the properties for the chips on the tiles
		this.chip = false;
		this.chipColor = false;
		this.chipKing = false;
		this.chipDir = 0;

		//this draw method will draw the tile and the chip on the tile
		this.draw = function () {
			//checks if the tile is good or not
			if (this.deadSpace) {
				//resets the size of the tile incase the window was resized
				this.size = board.size / 8;

				//creates a normal rectangle based on the position of the tile and the offset of the board
				ctx.fillStyle = this.color;
				ctx.fillRect(this.xPos * this.size + board.Hoffset, this.yPos * this.size + board.Voffset, this.size, this.size);

				//checks if there is a chip on the tile
				if (this.chip) {
					//if so it will find the center of the tile
					let xCenter = this.xPos * this.size + board.Hoffset + this.size / 2;
					let yCenter = this.yPos * this.size + board.Voffset + this.size / 2;

					//it will make the width of a drawn line thicker
					ctx.lineWidth = this.size / 10;

					//it then sets the fill and stroke colors based on what color chip is on the tile (true is red)
					if (this.chipColor) {
						ctx.fillStyle = this.redChipColors[0];
						ctx.strokeStyle = this.redChipColors[1];
					} else {
						ctx.fillStyle = this.blackChipColors[0];
						ctx.strokeStyle = this.blackChipColors[1];
					}

					//it will then draw the circle and fill/stroke it to draw it
					ctx.beginPath();
					ctx.arc(xCenter, yCenter, this.size / 2.5, 0, 2 * Math.PI);
					ctx.fill();
					ctx.stroke();

					//this draw the crown on the king pieces
					if (this.chipKing) {
						//this will make the outline a little smaller
						ctx.lineWidth = this.size / 24;

						//it then sets the colors
						ctx.fillStyle = this.kingColors[0];
						ctx.strokeStyle = this.kingColors[1];

						//begins a path
						ctx.beginPath();
						//it starts at the top left corner and will draw the crown going clockwise around it
						ctx.moveTo(xCenter - this.size / 6, yCenter - this.size / 8);
						ctx.lineTo(xCenter - this.size / 10, yCenter);
						ctx.lineTo(xCenter, yCenter - this.size / 5);
						ctx.lineTo(xCenter + this.size / 10, yCenter);
						ctx.lineTo(xCenter + this.size / 6, yCenter - this.size / 8);
						ctx.lineTo(xCenter + this.size / 5, yCenter + this.size / 5);
						ctx.lineTo(xCenter - this.size / 5, yCenter + this.size / 5);
						ctx.closePath();

						//it then fills and outlines the shape
						ctx.fill();
						ctx.stroke();
					}
				}
			}
		};
	}
}
