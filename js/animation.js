
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
