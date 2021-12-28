
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
