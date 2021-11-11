
const CARD_VAL = ['6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const DRAGON_VAL = ['DRAGON'];
const DRAGON_NUM = 4;
const NUM_SUITS = 4;
const SUIT_COLORS = ['red', 'green', 'blue'];


CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
	if (width < 2 * radius) radius = width / 2;
	if (height < 2 * radius) radius = height / 2;
	this.beginPath();
	this.moveTo(x + radius, y);
	this.arcTo(x + width, y, x + width, y + height, radius);
	this.arcTo(x + width, y + height, x, y + height, radius);
	this.arcTo(x, y + height, x, y, radius);
	this.arcTo(x, y, x + width, y, radius);
	this.closePath();
	return this;
}

let Card = function(val, suit=-1, x=0, y=0, width=100, height=140) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.isDragging = false;
	this.val = val;
	this.suit = suit;

	this.render = function(ctx, shade=false) {
		ctx.save();
		ctx.roundRect(this.x, this.y, this.width, this.height, this.width/15);
		if (shade) {
			ctx.fillStyle = '#ccc';
		} else {
			ctx.fillStyle = '#eee';
		}
		ctx.fill();
		ctx.strokeStyle = '#333';
		ctx.stroke();

		// text
		ctx.font = (this.width/8)+"pt sans-serif";
		let card_value = null;
		if (this.val >= 0) {
			card_value = CARD_VAL[this.val];
			ctx.fillStyle = SUIT_COLORS[this.suit%2];
		} else {
			card_value = DRAGON_VAL[this.val + 9];
			ctx.fillStyle = '#555';
		}
		ctx.fillText(card_value, this.x+10, this.y+25);
		ctx.restore();
	}
}

let Stack = function(x, y) {
	this.isBase = false;
	this.isDragonBase = false;
	this.dragonCount = 0;
	this.isDone = false;
	this.maxCardsAllowed = 99;
	this.cards = [];
	this.x = x;
	this.y = y;
	this.width = 100;
	this.spacing = 40;
	this.dragging = -1;
	// dragging x, y
	this.dx = 0;
	this.dy = 0;
	// dragging offset x, y
	this.ox = 0;
	this.oy = 0;
	this.hover = false;

	this.append = function(cards) {
		if (this.isDragonBase) {
			if (Array.isArray(cards) && cards[0].val < 0) {
				this.dragonCount += cards.length;
				return;
			} else if (cards.val < 0) {
				this.dragonCount += 1;
				return;
			}
		}
		if (this.isBase && cards.length === CARD_VAL.length) {
			this.isDone = true;
			return;
		}
		if (Array.isArray(cards)) {
			for (let i = 0; i < cards.length; i++) {
				this.cards.push(cards[i]);
			}
		} else {
			this.cards.push(cards);
		}
	}

	this.getNumOfDragging = function() {
		if (this.dragging < 0) {
			return 0;
		}
		return this.cards.length - this.dragging;
	}

	this.allowedToDrop = function(cards) {
		if (this.isBase) {
			if (this.isDone) {
				return false;
			}
			if (this.isDragonBase) {
				if (cards[0].val < 0){
					return true;
				}
				return false;
			} else {
				if (cards[0].val < 0){
					return false;
				}
				if (cards.length == CARD_VAL.length) {
					return true;
				}
			}
		}


		if (this.cards.length + cards.length > this.maxCardsAllowed) {
			return false;
		}

		if (this.cards.length > 0) {
			let bottom = this.cards[this.cards.length-1];
			let draggedTop = cards[0];
			if (bottom.val < 0 && draggedTop.val < 0) {
				return true;
			}
			if (bottom.val !== draggedTop.val + 1
				|| bottom.suit%2 == draggedTop.suit%2) {
				return false;
			}
		}

		return true;
	}

	this.getDraggingCards = function() {
		let res = [];
		for (let i = this.dragging; i < this.cards.length; i++) {
			res.push(this.cards[i]);
		}
		return res;
	}

	this.removeDraggingCards = function() {
		return this.cards.splice(this.dragging);
	}

	this.render = function(ctx) {
		ctx.save();
		// render background
		ctx.roundRect(this.x, this.y, this.width, 140, this.width/15);
		if (this.isDone) {
			ctx.fillStyle = '#77B97F';
			ctx.fill();
			ctx.fillStyle = '#eee';
			ctx.font = (this.width/8)+"pt sans-serif";
			ctx.fillText('Done', this.x+10, this.y+25);
		} else {
			
			if (this.isDragonBase) {
				ctx.fillStyle = '#ddd';
				ctx.fill();
				ctx.fillStyle = '#777';
				ctx.font = (this.width/8)+"pt sans-serif";
				ctx.fillText('Dragon', this.x+10, this.y+25);
				ctx.fillText(this.dragonCount+'/'+DRAGON_NUM, this.x+10, this.y+50);
			} else {
				ctx.fillStyle = '#999';
				ctx.fill();
			}
			
		}

		// render remaining
		let upTo = this.cards.length;
		if (this.dragging > -1) {
			upTo = this.dragging;
		}
		for (let i = 0; i < upTo; i++) {
			let card = this.cards[i];
			card.x = this.x;
			card.y = this.y + i*this.spacing;
			if (this.hover && i == upTo-1) {
				card.render(ctx, shade=true);
			} else {
				card.render(ctx);
			}
		}

		// render dragging
		for (let i = upTo; i < this.cards.length; i++) {
			let card = this.cards[i];
			card.x = this.dx-this.ox;
			card.y = this.dy-this.oy + (i-upTo)*this.spacing;
			card.render(ctx);
		}
		ctx.restore();
	}

	this.checkDrag = function(x, y) {
		let idx = -1;
		// check dragging index
		if (x > this.x && x < this.x+this.width && y > this.y) {
			let selected = false;
			for (let i = 0; i < this.cards.length; i++) {
				if (y < this.y + (i+1) * this.spacing) {
					idx = i;
					selected = true;
					break;
				}
			}
			if (!selected
					&& this.cards.length>0 
					&& y < this.y + (this.cards.length-1) * this.spacing + 140) {
				idx = this.cards.length-1;
			}
		}
		
		if (idx > -1) {
			// check if drag allowed
			
			// check all dragon
			let allDragon = true;
			for (let i = idx; i < this.cards.length; i++) {
				if (this.cards[i].val >= 0) {
					allDragon = false;
					break;
				}
			}
			if (!allDragon) {
				// not all dragon
				let prev = this.cards[idx];
				for (let i = idx+1; i < this.cards.length; i++) {
					let current = this.cards[i]
					if (current.val !== prev.val - 1 || current.suit%2 == prev.suit%2) {
						return -1;
					}
					prev = this.cards[i];
				}
			}

			// ok to drag
			this.dragging = idx;
			// update drag offset x, y
			this.ox = x - this.x;
			this.oy = y - (this.y + this.spacing*this.dragging);
		}

		return idx;
	}

	this.checkDropOver = function(x, y) {
		if (x > this.x && x < this.x+this.width && y > this.y) {
			if (this.cards.length < 1) {
				return y < this.y + 140;
			}
			return y < this.y + (this.cards.length-1) * this.spacing + 140;
		}
	}
}

function shuffle(array) {
	let currentIndex = array.length,  randomIndex;
	while (currentIndex != 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
	return array;
}

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let slot0 = new Stack(50, 20);
slot0.isBase = true;
slot0.maxCardsAllowed = 1;

let slot1 = new Stack(200, 20);
slot1.isBase = true;
slot1.maxCardsAllowed = 1;

let slot2 = new Stack(350, 20);
slot2.isBase = true;
slot2.isDragonBase = true;

let slot3 = new Stack(500, 20);
slot3.isBase = true;
slot3.maxCardsAllowed = 1;

let slot4 = new Stack(650, 20);
slot4.isBase = true;
slot4.maxCardsAllowed = 1;

let stackList = [slot0, slot1, slot2, slot3, slot4];

let deck = [];
for (let i = 0; i < NUM_SUITS; i++) {
	for (let j = 0; j < CARD_VAL.length; j++) {
		deck.push(new Card(j, i));
	}
}

// Dragons
for (let i = 0; i < DRAGON_NUM; i++) {
	deck.push(new Card(-9));
}

shuffle(deck);

let stackLeft = 50;
let stackTop = 180;
for (let i = 0; i < 6; i++) {
	let s = new Stack(stackLeft, stackTop);
	for (let j = 0; j < 6; j++) {
		if (deck.length == 0) {
			break;
		}
		s.append(deck.pop());
	}
	stackList.push(s);
	stackLeft += 120;
}


let state = {
	dragFrom: -1
}

function redraw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	slot1.render(ctx);

	for (let i = 0; i < stackList.length; i++) {
		if (i == state.dragFrom) {
			continue;
		}
		stackList[i].render(ctx);
	}
	if (state.dragFrom > -1) {
		stackList[state.dragFrom].render(ctx);
	}
}

document.onpointerdown = function ({x, y}) {
	for (let i = 0; i < stackList.length; i++) {
		let res = stackList[i].checkDrag(x, y);
		if (res > -1) {
			state.dragFrom = i;
		}
	}
}

document.onpointermove = function ({x, y}) {
	if (state.dragFrom > -1) {
		stackList[state.dragFrom].dx = x;
		stackList[state.dragFrom].dy = y;

		for (let i = 0; i < stackList.length; i++) {
			let stack = stackList[i]
			if (stack.checkDropOver(x, y) && i !== state.dragFrom) {
				stack.hover = true;
			} else {
				stack.hover = false;
			}
		}
	}

	redraw();
}

document.onpointerup = function ({x, y}) {
	if (state.dragFrom > -1) {
		// drop to stack
		for (let i = 0; i < stackList.length; i++) {
			stackList[i].hover = false;
			if (i == state.dragFrom) {
				continue;
			}
			if (stackList[i].checkDropOver(x, y)) {
				// intend to drop to this stack
				let toStack = stackList[i];
				let fromStack = stackList[state.dragFrom];
				if (toStack.allowedToDrop(fromStack.getDraggingCards())) {
					let cards = fromStack.removeDraggingCards();
					toStack.append(cards);
				}
				break;
			}
		}

		stackList[state.dragFrom].dragging = -1;
		state.dragFrom = -1;
	}
	redraw();
}


redraw();
