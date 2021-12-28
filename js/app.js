
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

	if (globalState.bgmOn && !globalState.bgmPlaying) {
		playBgm(true);
	}
}

function playBgm(val) {
	if (val) {
		globalState.bgm.play();
		globalState.bgmPlaying = true;
	} else {
		globalState.bgm.pause();
		globalState.bgmPlaying = false;
	}
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

	bgmOn: true,
	bgmPlaying: false,
	bgm: null,

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

		if (colorblindBtn.classList.contains("btn-on")) {
			colorblindBtn.classList.remove("btn-on");
		} else {
			colorblindBtn.classList.add("btn-on");
		}
	});

	let weatherBtn = document.getElementById('btn-weather');
	weatherBtn.addEventListener("click", function () {
		setWeather(!globalState.showWeather);

		if (weatherBtn.classList.contains("btn-on")) {
			weatherBtn.classList.remove("btn-on");
		} else {
			weatherBtn.classList.add("btn-on");
		}
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
		if (bugBtn.classList.contains("btn-on")) {
			bugBtn.classList.remove("btn-on");
		} else {
			bugBtn.classList.add("btn-on");
		}
	});

	let musicBtn = document.getElementById('btn-music');
	musicBtn.addEventListener("click", function () {
		globalState.bgmOn = !globalState.bgmOn;
		playBgm(globalState.bgmOn);
		if (musicBtn.classList.contains("btn-on")) {
			musicBtn.classList.remove("btn-on");
		} else {
			musicBtn.classList.add("btn-on");
		}
	});

	let langBtn = document.getElementById('btn-lang');
	langBtn.addEventListener("click", function () {
		globalState.lang = (globalState.lang+1)%(LANG['btn_new_game'].length);
		musicBtn.innerHTML = LANG['btn_music'][globalState.lang];
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

	globalState.bgm = document.createElement("audio");
	globalState.bgm.src = "sound/green-tea.mp3";
	globalState.bgm.loop = true;

	//checkWin(globalState, true);
	//bugStart();
});
