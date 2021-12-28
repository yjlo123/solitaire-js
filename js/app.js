
const CARD_VAL = ['6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_VAL_CN = ['陆', '柒', '捌', '玖', '拾', '钩', '圈', '凯'];
const CARD_VAL_EM = ['6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '1️⃣', '2️⃣', '3️⃣'];
const SUITS = ['♦', '♠', '♥', '♣'];
const DRAGON_VALS = ['★', '✿', '❤', '♬', '☂'];
const DRAGON_NUM = 4;
const NUM_SUITS = 4;
const SUIT_COLORS = ['red', 'green'];
const SUIT_COLORS_BLIND = ['#924900', '#006ddb'];

const CARD_VALUE_OFFSET = [
	[0, 0],
	[0, 0],
	[0, 0],
	[0, 0],
	[-5, 0],
	[0, 0],
	[-2, 0],
	[-1, 0],
];

const COLORBLIND_RECT = [5, 8, 20, 22];
const COLORBLIND_RECT_CN = [9, 8, 19, 22];

const COLORBLIND_CIRCLE = [15, 19, 11];
const COLORBLIND_CIRCLE_CN = [18, 19, 11];

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
// roundTrapezoid
CanvasRenderingContext2D.prototype.roundSkewRect = function (x, y, width, height, radius, skewRight=5, skewLeft=0) {
	if (width < 2 * radius) radius = width / 2;
	if (height < 2 * radius) radius = height / 2;
	this.beginPath();
	this.moveTo(x + radius, y-skewLeft);
	this.arcTo(x + width, y-skewRight, x + width, y + height, radius);
	this.arcTo(x + width, y + height+skewRight, x, y + height, radius);
	this.arcTo(x, y + height+skewLeft, x, y, radius);
	this.arcTo(x, y-skewLeft, x + width, y, radius);
	this.closePath();
	return this;
}

function checkStats(state, limit = 0) {
	let interval = -1
	if (state.stats.lastTs > 0) {
		interval = Date.now() - state.stats.lastTs;
	}
	if (interval > limit) {
		if (state.showStats) {
			let fps = Math.floor(1000 / interval);
			document.getElementById("stats").innerHTML = fps + " fps";
		}
		state.stats.lastTs = Date.now();
	}
	return interval;
}

function redraw(state, limit = 0, frontOnly=false) {
	let interval = checkStats(state, limit);
	if (interval > 0 && interval < limit) {
		return;
	}

	/* draw */
	if (!frontOnly) {
		state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
		for (let i = 0; i < state.stackList.length; i++) {
			state.stackList[i].render(state.ctx, state.ctxF);
		}
	}

	state.ctxF.clearRect(0, 0, state.canvas.width, state.canvas.height);
	if (state.dragFrom > -1) {
		state.stackList[state.dragFrom].render(null, state.ctxF);
	}
	if (state.animStack > -1) {
		state.stackList[state.animStack].render(null, state.ctxF);
	}
}

function shuffle(array) {
	let currentIndex = array.length, randomIndex;
	while (currentIndex != 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
	return array;
}

function initSlots(stackList) {
	const left = 50;
	const top = 20;
	const spacing = 150;
	for (let i = 0; i < 5; i++) {
		let slot = new Stack(50, 20);
		slot.isBase = true;
		slot.maxCardsAllowed = 1;
	}

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
			let idx = i + columns * j;
			if (idx >= decks.length) {
				break;
			}
			s.append(decks[idx]);
		}
		stackList.push(s);
		stackLeft += 120;
	}
}

function getMousePos(canvas, cx, cy) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: (cx - rect.left) / (rect.right - rect.left) * canvas.width,
		y: (cy - rect.top) / (rect.bottom - rect.top) * canvas.height
	};
}

function registerPointerListeners(state) {
	state.canvasF.onpointerdown = function ({ x, y }) {
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
		redraw(state);
	}

	state.canvasF.onpointermove = function ({ x, y }) {
		if (state.dragFrom > -1) {
			state.stackList[state.dragFrom].dx = x;
			state.stackList[state.dragFrom].dy = y;

			for (let i = 0; i < state.stackList.length; i++) {
				let stack = state.stackList[i];
				if (stack.checkDropOver(x, y) && i !== state.dragFrom) {
					if (!stack.hover) {
						stack.hover = true;
						redraw(state);
					}
				} else {
					if (stack.hover) {
						stack.hover = false;
						redraw(state);
					}
				}
			}
			redraw(state, 15, true);
		}
	}

	state.canvasF.onpointerup = function ({ x, y }) {
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

		if (!state.gameWin) {
			redraw(state);

			checkReveal(state);

			checkWin(state);
		}
	}
}

function animMoveBack(time) {
	let stack = globalState.stackList[globalState.animStack];
	if (!stack) {
		return;
	}

	if (globalState.animStartTime === undefined) {
		globalState.animStartTime = time;
	}
	let timeUnits = (time - globalState.animStartTime) / globalState.animRate;

	if (timeUnits > 16) {
		stack.releasing = -1;
		globalState.animStack = -1;
		redraw(globalState);
		return;
	}

	stack.dx += (stack.x + stack.ox - stack.dx) / 15 * timeUnits;
	stack.dy += (stack.y + stack.oy + stack.spacing * stack.releasing - stack.dy) / 15 * timeUnits;
	if (timeUnits > (16 - DEFAULT_SHADOW_LEVEL) && stack.shadowLevel > 0) {
		stack.shadowLevel -= 1;
		stack.shadowOffset = Math.max(stack.shadowOffset - 1, 0);
	}
	redraw(globalState, 15, true);
	requestAnimationFrame(animMoveBack);
}

function animDealCard(time) {
	if (!globalState.animDealingCards) {
		return;
	}
	checkStats(globalState);

	if (globalState.animStartTime === -1) {
		globalState.animStartTime = time;
	}
	let timeUnits = (time - globalState.animStartTime) / 10;

	const overallDelay = 80;
	const delay = 3;

	if (timeUnits > 21 + globalState.deckCards.length * delay + overallDelay) {
		globalState.animDealingCards = false;
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
		let targetX = 50 + 120 * (i % 6);
		let targetY = 180 + 40 * Math.floor(i / 6);
		card.x = fromX + (targetX - fromX) / 20 * timeOffset;
		card.y = fromY + (targetY - fromY) / 20 * timeOffset;
	}

	/* redraw */
	globalState.ctx.clearRect(0, 0, globalState.canvas.width, globalState.canvas.height);
	/* free cells */
	for (let i = 0; i < 5; i++) {
		globalState.stackList[i].render(globalState.ctx);
	}

	let remainingIdx = Math.floor((Math.max(timeUnits - overallDelay, 0)) / delay);

	/* remaining cards */
	for (let i = globalState.deckCards.length - 1; i > remainingIdx; i--) {
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
	colorBlind: false,
	showWeather: true,
	hideCount: 0,
	gameWin: false,
	showBug: false,
	lang: 0,

	stats: {
		lastTs: Date.now()
	},
	showStats: false,
	animRate: 20, // higher is slower

	showHomeScreen: true,
	homeCards: [],
	homeDecks: [],
	animHomeTime: -1,
	animHomeOffset: 0,

	fadeOutCallback: function(){},
	fadeInCallback: function(){},
	transitionOpacity: 0,
	transitionTime: 0,

	canvas: null,
	canvasF: null, // foreground
	canvasH: null, // home
	canvasT: null, // transition
	ctx: null,
	ctxF: null,
	ctxH: null,
	ctxT: null,

	dragFrom: -1,
	stackList: [],
	deckCards: [],
	dragonSymbol: DRAGON_VALS[Math.floor(Math.random() * DRAGON_VALS.length)],

	animStack: -1,
	animDealingCards: false,
	animStartTime: -1,

	redraw: function() {
		redraw(globalState);
	},

	initGame: function () {
		initStacks(globalState.stackList, globalState.deckCards);
		redraw(globalState);
		registerPointerListeners(globalState);

		checkReveal(globalState);
	}
}

function checkReveal(state) {
	for (let i = 0; i < state.stackList.length; i++) {
		let stack = state.stackList[i];
		if (stack.cards.length > 0) {
			let lastCard = stack.cards[stack.cards.length-1];
			if (!lastCard.revealed) {
				lastCard.reveal(state);
			}
		}
	}
}

function checkWin(state, testSkip=false) {
	if (state.gameWin) {
		return true;
	}
	if (!testSkip) {
		for (let i = 0; i < 5; i++) {
			let stack = state.stackList[i];
			if (stack.isBase && !stack.isDragonBase && !stack.isDone) {
				return false;
			}
			if (stack.isDragonBase && stack.dragonCount !== DRAGON_NUM) {
				return false;
			}
		}
	}

	startFireWorkDisplay();
	state.gameWin = true;
	return true;
}

function setWeather(value) {
	globalState.showWeather = value;
	if (value) {
		playSnow();
	} else {
		stopSnow();
	}
}

function startGame(hideCount=0) {
	globalState.stackList = [];
	globalState.deckCards = [];
	globalState.dragFrom = -1;
	globalState.animStack = -1;
	globalState.animStartTime = -1;
	globalState.animDealingCards = false;
	globalState.hideCount = hideCount

	initSlots(globalState.stackList);
	globalState.deckCards = initDecks();

	for (let i = 0; i < globalState.hideCount; i++) {
		globalState.deckCards[i].revealed = false;
	}

	globalState.animDealingCards = true;
	requestAnimationFrame(animDealCard);
	stopFireWorkDisplay();
	globalState.gameWin = false;

	document.getElementById("btn-resume").classList.remove("disabled");

	globalState.fadeOutCallback = () => {
		globalState.showHomeScreen = false;
		clearHomeCanvas(globalState);
		document.getElementById("canvas-f").style.display = "block";
		requestAnimationFrame(animFadeIn);
	};
	requestAnimationFrame(animFadeOut);
}


window.addEventListener('load', (event) => {
	checkStats(globalState);

	let mainMenu = document.getElementById("main-menu");
	let bottomBarLeft = document.getElementById("bottom-bar-left");

	let newGameEasy = document.getElementById('btn-new-easy');
	newGameEasy.addEventListener("click", function () {
		mainMenu.style.display = "none";
		bottomBarLeft.style.display = "block";
		startGame();
	});

	let newGameMedium = document.getElementById('btn-new-medium');
	newGameMedium.addEventListener("click", function () {
		mainMenu.style.display = "none";
		bottomBarLeft.style.display = "block";
		startGame(6);
	});

	let newGameHard = document.getElementById('btn-new-hard');
	newGameHard.addEventListener("click", function () {
		mainMenu.style.display = "none";
		bottomBarLeft.style.display = "block";
		startGame(12);
	});

	let gameResume = document.getElementById('btn-resume');
	gameResume.addEventListener("click", function () {
		if (gameResume.classList.contains('disabled')) {
			return;
		}

		globalState.fadeOutCallback = () => {
			mainMenu.style.display = "none";
			bottomBarLeft.style.display = "block";
			globalState.showHomeScreen = false;
			clearHomeCanvas(globalState);
			document.getElementById("canvas-f").style.display = "block";
			requestAnimationFrame(animFadeIn);
		};
		requestAnimationFrame(animFadeOut);
	});

	let menuBtn = document.getElementById("btn-menu");
	menuBtn.addEventListener("click", function () {
		globalState.fadeOutCallback = () => {
			bottomBarLeft.style.display = "none";
			mainMenu.style.display = "block";
			globalState.showHomeScreen = true;
			requestAnimationFrame(animColumn);
			document.getElementById("canvas-f").style.display = "none";
			requestAnimationFrame(animFadeIn);
		};
		requestAnimationFrame(animFadeOut);
	});

	let colorblindBtn = document.getElementById('btn-colorblind');
	colorblindBtn.addEventListener("click", function () {
		globalState.colorBlind = !globalState.colorBlind;
		redraw(globalState);
	});

	let weatherBtn = document.getElementById('btn-weather');
	weatherBtn.addEventListener("click", function () {
		setWeather(!globalState.showWeather);
	});

	let bugBtn = document.getElementById('btn-bug');
	bugBtn.addEventListener("click", function () {
		if (globalState.showBug) {
			globalState.showBug = false;
			bugStop();
		} else {
			globalState.showBug = true;
			bugStart();
		}
	});

	let langBtn = document.getElementById('btn-lang');
	langBtn.addEventListener("click", function () {
		globalState.lang = (globalState.lang+1)%(LANG['btn_new_game'].length);
		bugBtn.innerHTML = LANG['btn_bug'][globalState.lang];
		colorblindBtn.innerHTML = LANG['btn_colorblind'][globalState.lang];
		weatherBtn.innerHTML = LANG['btn_weather'][globalState.lang];
		langBtn.innerHTML = LANG['btn_lang'][globalState.lang];

		document.getElementById('menu-title').innerHTML = LANG['menu_title'][globalState.lang];
		document.getElementById('btn-new-easy').innerHTML = LANG['menu_easy'][globalState.lang];
		document.getElementById('btn-new-medium').innerHTML = LANG['menu_medium'][globalState.lang];
		document.getElementById('btn-new-hard').innerHTML = LANG['menu_hard'][globalState.lang];
		document.getElementById('btn-resume').innerHTML = LANG['menu_resume'][globalState.lang];
		document.getElementById('btn-menu').innerHTML = LANG['menu_btn'][globalState.lang];

		document.getElementById('instruct-1').innerHTML = LANG['text_instruct_1'][globalState.lang];
		document.getElementById('instruct-2').innerHTML = LANG['text_instruct_2'][globalState.lang];
		document.getElementById('instruct-3').innerHTML = LANG['text_instruct_3'][globalState.lang];
		document.getElementById('instruct-4').innerHTML = LANG['text_instruct_4'][globalState.lang];
		redraw(globalState);
	});

	globalState.canvas = document.getElementById('canvas-b');
	globalState.ctx = globalState.canvas.getContext('2d');

	globalState.canvasF = document.getElementById('canvas-f');
	globalState.ctxF = globalState.canvasF.getContext('2d');

	globalState.canvasH = document.getElementById('canvas-h');
	globalState.ctxH = globalState.canvasH.getContext('2d');

	globalState.canvasT = document.getElementById('canvas-t');
	globalState.ctxT = globalState.canvasT.getContext('2d');

	setWeather(true);


	// init home animation
	globalState.homeCards = initDecks();
	for (let i = 0; i < 6; i++) {
		globalState.homeDecks.push(globalState.homeCards.slice(i*7, (i+1)*7-1));
	}

	requestAnimationFrame(animColumn);
	document.getElementById("canvas-f").style.display = "none";

	//checkWin(globalState, true);

	//bugStart();
});

function animFadeOut(time) {
	if (time - globalState.transitionTime < 30) {
		return requestAnimationFrame(animFadeOut);
	}
	globalState.transitionTime = time;

	if (globalState.transitionOpacity >= 1) {
		globalState.fadeOutCallback();
		return;
	}

	globalState.transitionOpacity = Math.min(globalState.transitionOpacity+0.1, 1);

	globalState.ctxT.clearRect(0, 0, globalState.canvas.width, globalState.canvas.height);
	globalState.ctxT.fillStyle = "#555";
	globalState.ctxT.globalAlpha = globalState.transitionOpacity;
	globalState.ctxT.fillRect(0, 0, 800, 650);

	requestAnimationFrame(animFadeOut);
}

function animFadeIn(time) {
	if (time - globalState.transitionTime < 30) {
		return requestAnimationFrame(animFadeIn);
	}
	globalState.transitionTime = time;

	if (globalState.transitionOpacity <= 0) {
		globalState.fadeInCallback();
		return;
	}

	globalState.transitionOpacity = Math.max(globalState.transitionOpacity-0.1, 0);

	globalState.ctxT.clearRect(0, 0, globalState.canvas.width, globalState.canvas.height);
	globalState.ctxT.fillStyle = "#555";
	globalState.ctxT.globalAlpha = globalState.transitionOpacity;
	globalState.ctxT.fillRect(0, 0, 800, 650);

	requestAnimationFrame(animFadeIn);
}

function clearHomeCanvas(state) {
	state.ctxH.clearRect(0, 0, state.canvas.width, state.canvas.height);
}

function redrawHome(state) {
	state.ctxH.clearRect(0, 0, state.canvas.width, state.canvas.height);
	state.ctxH.fillStyle = "#c9c9c9";
	state.ctxH.fillRect(0, 0, 800, 650);
	//state.ctxH.globalAlpha = 0.9;

	let x = 20;
	let y = globalState.animHomeOffset - 180;


	for (let k = 0; k < 5; k++) {
		let col = globalState.homeDecks[k]; 
		for (let i = 0; i < 6; i++) {
			col[i].x = x;
			col[i].y = y;
			col[i].render(state.ctxH);
			y += 180;
		}
		x += 165;
		y = globalState.animHomeOffset - 180;
		if (k % 2 == 0) {
			y -= 95;
		}
	}

	if (globalState.animHomeOffset >= 180) {
		for (let i = 0; i < 6; i++) {
			let col = globalState.homeDecks[i];
			globalState.homeDecks[i] = col.slice(col.length-1).concat(col.slice(0, col.length-1));
		}
		globalState.animHomeOffset = 0;
	}
}

function animColumn(time) {
	if (!globalState.showHomeScreen) {
		return;
	}

	if (time - globalState.animHomeTime < 50) {
		return requestAnimationFrame(animColumn);
	}
	globalState.animHomeTime = time;

	globalState.animHomeOffset += 1;

	redrawHome(globalState);
	requestAnimationFrame(animColumn);
}
