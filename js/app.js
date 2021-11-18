
const CARD_VAL = ['6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♦', '♠', '♥', '♣'];
const DRAGON_VALS = ['★', '✿', '❤', '♬', '☁', '❅', '☂'];
const DRAGON_NUM = 4;
const NUM_SUITS = 4;
const SUIT_COLORS = ['red', 'green', 'blue'];
const DEFAULT_SHADOW_LEVEL = 15;
const DEFAULT_SHADOW_OFFSET = 4;

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
	this.val = val;
	this.suit = suit;
	this.dealt = false;

	this.render = function(ctx, shade=false) {
		ctx.save();
		ctx.roundRect(this.x, this.y, this.width, this.height, this.width/15);
		if (shade) {
			ctx.fillStyle = '#ddd';
		} else {
			ctx.fillStyle = '#eee';
		}
		if (this.dealt) {
			ctx.save();
			ctx.shadowBlur = 3;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 2;
			ctx.shadowColor = 'rgba(0,0,0,0.4)';
			ctx.fill();
			ctx.restore();
		} else {
			ctx.fill();
		}
		ctx.strokeStyle = '#ccc';
		ctx.stroke();

		// text
		if (this.val >= 0) {
			ctx.font = (this.width/8)+"pt sans-serif";
			ctx.fillStyle = SUIT_COLORS[this.suit%2];
			ctx.fillText(CARD_VAL[this.val], this.x+10, this.y+25);
			// ctx.font = (this.width/10)+"pt sans-serif";
			// ctx.fillText(SUITS[this.suit], this.x+20, this.y+24);
		} else {
			ctx.font = (this.width/8)+"pt sans-serif";
			ctx.fillStyle = '#555';
			ctx.fillText(globalState.dragonSymbol, this.x+10, this.y+25);
		}
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
	this.releasing = -1;
	this.isAnimating = false;
	// dragging x, y
	this.dx = 0;
	this.dy = 0;
	// dragging offset x, y
	this.ox = 0;
	this.oy = 0;
	this.hover = false;
	this.shadowLevel = DEFAULT_SHADOW_LEVEL;
	this.shadowOffset = DEFAULT_SHADOW_OFFSET;

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
		/* render background */
		if (this.isDone) {
			/* stack card back */
			for (let i = 0; i < CARD_VAL.length/2; i++) {
				ctx.roundRect(this.x, this.y-2*i, this.width, 140, this.width/15);
				ctx.fillStyle = '#eee';
				ctx.fill();
				ctx.strokeStyle = '#333';
				ctx.stroke();
			}
			const offset = 2 * (CARD_VAL.length/2-1);
			let padding = Math.floor(this.width / 25);
			ctx.roundRect(this.x+padding, this.y-offset+padding, this.width-padding*2, 140-padding*2, (this.width-padding*2)/15);
			ctx.fillStyle = '#77B97F';
			ctx.fill();
			// ctx.fillStyle = '#eee';
			// ctx.font = (this.width/8)+"pt sans-serif";
			// ctx.fillText('Done', this.x+10, this.y+25);
		} else {
			ctx.roundRect(this.x, this.y, this.width, 140, this.width/15);
			if (this.isDragonBase) {
				/* dragon cell */
				ctx.fillStyle = '#ddd';
				ctx.fill();
				ctx.fillStyle = '#777';
				ctx.font = (this.width/8)+"pt sans-serif";
				ctx.fillText(globalState.dragonSymbol, this.x+10, this.y+25);
				ctx.fillText(this.dragonCount+'/'+DRAGON_NUM, this.x+10, this.y+50);
			} else {
				/* empty slot */
				ctx.fillStyle = '#aaa';
				ctx.fill();
			}
		}

		/* render remaining */
		let upTo = this.cards.length;
		if (this.dragging > -1) {
			upTo = this.dragging;
		}
		if (this.releasing > -1) {
			upTo = this.releasing;
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

		/* render dragging */
		if (this.cards[upTo]) {
			/* draw shadow */
			ctx.save();
			ctx.roundRect(this.dx-this.ox, this.dy-this.oy, this.width, 140+this.spacing*(this.cards.length-upTo-1), this.width/15);
			ctx.shadowBlur = this.shadowLevel;
			ctx.shadowOffsetX = this.shadowOffset;
			ctx.shadowOffsetY = this.shadowOffset;
			ctx.shadowColor = 'rgba(0,0,0,0.3)';
			ctx.fill();
			ctx.restore();
		}

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

function checkStats(state, limit=0) {
	let interval = -1
	if (state.stats.lastTs > 0) {
		interval = Date.now() - state.stats.lastTs;
	}
	if (interval > limit) {
		let fps = Math.floor(1000 / interval);
		document.getElementById("stats").innerHTML = fps + " fps";
		state.stats.lastTs = Date.now();
	}
	return interval;
}

function redraw(state, limit=0) {
	let interval = checkStats(state, limit);
	if (interval > 0 && interval < limit) {
		return;
	}

	/* draw */
	state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
	for (let i = 0; i < state.stackList.length; i++) {
		if (i == state.dragFrom || i == state.animStack) {
			continue;
		}
		state.stackList[i].render(state.ctx);
	}
	if (state.dragFrom > -1) {
		state.stackList[state.dragFrom].render(state.ctx);
	}
	if (state.animStack > -1) {
		state.stackList[state.animStack].render(state.ctx);
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

function initSlots(stackList) {
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

	stackList.push(slot0);
	stackList.push(slot1);
	stackList.push(slot2);
	stackList.push(slot3);
	stackList.push(slot4);
}

function initDecks() {
	let deck = [];

	// Generate normal cards
	for (let i = 0; i < NUM_SUITS; i++) {
		for (let j = 0; j < CARD_VAL.length; j++) {
			deck.push(new Card(j, i));
		}
	}

	// Generate dragon cards
	for (let i = 0; i < DRAGON_NUM; i++) {
		deck.push(new Card(-9));
	}

	shuffle(deck);
	return deck;
}

function initStacks(stackList, decks) {
	let stackLeft = 50;
	let stackTop = 180;
	const columns = 6;
	const rows = 6;

	for (let i = 0; i < columns; i++) {
		let s = new Stack(stackLeft, stackTop);
		for (let j = 0; j < rows; j++) {
			let idx = i + columns*j;
			if (idx >= decks.length) {
				break;
			}
			s.append(decks[idx]);
		}
		stackList.push(s);
		stackLeft += 120;
	}
}

function registerPointerListeners(state) {
	document.onpointerdown = function ({x, y}) {
		for (let i = 0; i < state.stackList.length; i++) {
			let res = state.stackList[i].checkDrag(x, y);
			if (res > -1) {
				state.dragFrom = i;
				let stack = state.stackList[state.dragFrom]
				stack.dx = x;
				stack.dy = y;
				stack.shadowLevel = DEFAULT_SHADOW_LEVEL;
				stack.shadowOffset = DEFAULT_SHADOW_OFFSET;
			}
		}
	}
	
	document.onpointermove = function ({x, y}) {
		if (state.dragFrom > -1) {
			state.stackList[state.dragFrom].dx = x;
			state.stackList[state.dragFrom].dy = y;
	
			for (let i = 0; i < state.stackList.length; i++) {
				let stack = state.stackList[i];
				if (stack.checkDropOver(x, y) && i !== state.dragFrom) {
					stack.hover = true;
				} else {
					stack.hover = false;
				}
			}
			redraw(state, 15);
		}
	}
	
	document.onpointerup = function ({x, y}) {
		if (state.dragFrom > -1) {
			let isValidMove = false;
			let fromStack = state.stackList[state.dragFrom];
			// drop to stack
			for (let i = 0; i < state.stackList.length; i++) {
				state.stackList[i].hover = false;
				if (i == state.dragFrom) {
					continue;
				}
				if (state.stackList[i].checkDropOver(x, y)) {
					// intend to drop to this stack
					let toStack = state.stackList[i];
					if (toStack.allowedToDrop(fromStack.getDraggingCards())) {
						let cards = fromStack.removeDraggingCards();
						toStack.append(cards);
						isValidMove = true;
					}
					break;
				}
			}
			if (!isValidMove) {
				state.animStartTime = undefined;
				state.animStack = state.dragFrom;
				fromStack.releasing = fromStack.dragging;
				requestAnimationFrame(animMoveBack);
			}

			fromStack.dragging = -1;
			state.dragFrom = -1;
		}
		redraw(state);
	}
}

function animMoveBack(time) {
	let stack = globalState.stackList[globalState.animStack];

	if (globalState.animStartTime === undefined) {
		globalState.animStartTime = time;
	}
	let timeUnits = (time - globalState.animStartTime)/globalState.animRate;

	if (timeUnits > 16) {
		stack.releasing = -1;
		globalState.animStack = -1;
		redraw(globalState);
		return;
	}

	stack.dx += (stack.x + stack.ox - stack.dx)/15 * timeUnits;
	stack.dy += (stack.y + stack.oy  +stack.spacing * stack.releasing - stack.dy)/15 * timeUnits;
	if (timeUnits > (16-DEFAULT_SHADOW_LEVEL) && stack.shadowLevel > 0) {
		stack.shadowLevel -= 1;
		stack.shadowOffset = Math.max(stack.shadowOffset-1, 0);
	}
	redraw(globalState);
	requestAnimationFrame(animMoveBack);
}

function animDealCard(time) {
	checkStats(globalState);

	if (globalState.animStartTime === undefined) {
		globalState.animStartTime = time;
	}
	let timeUnits = (time - globalState.animStartTime)/10;

	const overallDelay = 80;
	const delay = 3;

	if (timeUnits > 21 + globalState.deckCards.length * delay + overallDelay) {
		globalState.initGame();
		return;
	}

	for (let i = 0; i < globalState.deckCards.length; i++) {
		let card = globalState.deckCards[i];
		let timeOffset = timeUnits - overallDelay - delay * i;
		if (timeOffset < 0) {
			timeOffset = 0;
		} else if (timeOffset > 20) {
			timeOffset = 20;
			card.dealt = true;
		}

		const fromX = 350;
		const fromY = 20;
		let targetX = 50 + 120 * (i%6);
		let targetY = 180 + 40 * Math.floor(i/6);
		card.x = fromX + (targetX - fromX)/20 * timeOffset;
		card.y = fromY + (targetY - fromY)/20 * timeOffset;
	}

	/* redraw */
	globalState.ctx.clearRect(0, 0, globalState.canvas.width, globalState.canvas.height);
	/* free cells */
	for (let i = 0; i < 5; i++) {
		globalState.stackList[i].render(globalState.ctx);
	}

	let remainingIdx = Math.floor((Math.max(timeUnits - overallDelay, 0))/delay);

	/* remaining cards */
	for (let i = globalState.deckCards.length-1; i > remainingIdx; i--) {
		globalState.deckCards[i].render(globalState.ctx);
	}
	/* dealt cards */
	for (let i = 0; i <= remainingIdx; i++) {
		if (i >= globalState.deckCards.length) {
			// to prevent out of bound
			continue;
		}
		globalState.deckCards[i].render(globalState.ctx);
	}

	requestAnimationFrame(animDealCard);
}

let globalState = {
	stats: {
		lastTs: Date.now()
	},
	animRate: 20, // higher is slower

	canvas: null,
	ctx: null,
	dragFrom: -1,
	stackList: [],
	deckCards: [],
	dragonSymbol: DRAGON_VALS[Math.floor(Math.random() * DRAGON_VALS.length)],

	animStack: -1,
	animStartTime: -1,

	initGame: function () {
		initStacks(globalState.stackList, globalState.deckCards);
		redraw(globalState);
		registerPointerListeners(globalState);
	}
}

window.addEventListener('load', (event) => {
	checkStats(globalState);

	globalState.canvas = document.getElementById('canvas');
	globalState.ctx = globalState.canvas.getContext('2d');
	initSlots(globalState.stackList);
	globalState.deckCards = initDecks();
	
	requestAnimationFrame(animDealCard);
});

