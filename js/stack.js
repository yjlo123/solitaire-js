let Stack = function (x, y) {
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

	this.append = function (cards) {
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
		this.updateSpacing();
	}

	this.updateSpacing = function () {
		if (this.cards.length > 9) {
			this.spacing = Math.floor(320 / (this.cards.length - 1));
		} else {
			this.spacing = 40;
		}
	}

	this.getNumOfDragging = function () {
		if (this.dragging < 0) {
			return 0;
		}
		return this.cards.length - this.dragging;
	}

	this.allowedToDrop = function (cards) {
		if (this.isBase) {
			if (this.isDone) {
				return false;
			}
			if (this.isDragonBase) {
				if (cards[0].val < 0) {
					return true;
				}
				return false;
			} else {
				if (cards[0].val < 0) {
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
			let bottom = this.cards[this.cards.length - 1];
			let draggedTop = cards[0];
			if (bottom.val < 0 && draggedTop.val < 0) {
				return true;
			}
			if (bottom.val !== draggedTop.val + 1
				|| bottom.suit % 2 == draggedTop.suit % 2) {
				return false;
			}
		}

		return true;
	}

	this.getDraggingCards = function () {
		let res = [];
		for (let i = this.dragging; i < this.cards.length; i++) {
			res.push(this.cards[i]);
		}
		return res;
	}

	this.removeDraggingCards = function () {
		let cards = this.cards.splice(this.dragging);
		this.updateSpacing();
		return cards;
	}

	this.render = function (ctx=null, ctxF=null) {
		if (ctx) {
			ctx.save();
			/* render background */
			if (this.isDone) {
				/* stack card back */
				for (let i = 0; i < CARD_VAL.length / 2; i++) {
					ctx.roundRect(this.x, this.y - 2 * i, this.width, 140, this.width / 15);
					ctx.fillStyle = '#eee';
					ctx.save();
					ctx.shadowBlur = 2;
					ctx.shadowOffsetX = 0;
					ctx.shadowOffsetY = 1;
					ctx.shadowColor = 'rgba(0,0,0,0.3)';
					ctx.fill();
					ctx.restore();
					ctx.strokeStyle = '#bbb';
					ctx.stroke();
				}
				const offset = 2 * (CARD_VAL.length / 2 - 1);
				let padding = Math.floor(this.width / 15);
				ctx.roundRect(this.x + padding, this.y - offset + padding, this.width - padding * 2, 140 - padding * 2, (this.width - padding * 2) / 15);
				ctx.fillStyle = '#77B97F';
				ctx.fill();
			} else {
				if (this.isDragonBase) {
					/* dragon cell */
					if (this.dragonCount > 0) {
						for (let i = 0; i < this.dragonCount; i++) {
							ctx.roundRect(this.x, this.y - i * 2, this.width, 140, this.width / 15);
							ctx.fillStyle = '#eee';
							ctx.save();
							ctx.shadowBlur = 2;
							ctx.shadowOffsetX = 0;
							ctx.shadowOffsetY = 1;
							ctx.shadowColor = 'rgba(0,0,0,0.3)';
							ctx.fill();
							ctx.restore();
							ctx.strokeStyle = '#ccc';
							ctx.stroke();
	
							let stackOffsetY = 2 * (this.dragonCount - 1);
							let padding = Math.floor(this.width / 15);
							ctx.roundRect(this.x + padding, this.y + padding - stackOffsetY, this.width - padding * 2, 140 - padding * 2, (this.width - padding * 2) / 15);
							ctx.fillStyle = '#77B97F';
							ctx.fill();
	
							ctx.fillStyle = '#eee';
							ctx.font = (this.width / 8) + "pt sans-serif";
							ctx.fillText(globalState.dragonSymbol, this.x + 10, this.y + 25 - stackOffsetY);
							ctx.fillText(this.dragonCount + '/' + DRAGON_NUM, this.x + 10, this.y + 50 - stackOffsetY);
						}
	
					} else {
						ctx.roundRect(this.x, this.y, this.width, 140, this.width / 15);
						ctx.fillStyle = '#aaa';
						ctx.fill();

						ctx.save();
						ctx.shadowColor = 'rgba(0,0,0,0.4)';
						ctx.shadowBlur = 3;
						ctx.shadowOffsetX = 1;
						ctx.shadowOffsetY = 1;
						ctx.globalCompositeOperation = 'source-atop';
						ctx.roundRect(this.x, this.y, this.width, 140, this.width / 15);
						ctx.strokeStyle = '#ccc';
						ctx.stroke();
						ctx.globalCompositeOperation = 'source-over';
						ctx.restore();

						ctx.fillStyle = '#777';
						ctx.font = (this.width / 8) + "pt sans-serif";
						ctx.fillText(globalState.dragonSymbol, this.x + 10, this.y + 25);
						ctx.fillText(this.dragonCount + '/' + DRAGON_NUM, this.x + 10, this.y + 50);
					}
				} else {
					/* empty cell */
					ctx.roundRect(this.x, this.y, this.width, 140, this.width / 15);
					ctx.fillStyle = '#aaa';
					ctx.fill();

					ctx.shadowColor = 'rgba(0,0,0,0.4)';
					ctx.shadowBlur = 3;
					ctx.shadowOffsetX = 1;
					ctx.shadowOffsetY = 1;
					ctx.globalCompositeOperation = 'source-atop';
					ctx.roundRect(this.x, this.y, this.width, 140, this.width / 15);
					ctx.strokeStyle = '#ccc';
					ctx.stroke();
					ctx.globalCompositeOperation = 'source-over';
				}
			}
			ctx.restore();
		}

		let upTo = this.cards.length;
		if (this.dragging > -1) {
			upTo = this.dragging;
		}
		if (this.releasing > -1) {
			upTo = this.releasing;
		}

		/* render remaining */
		if (ctx !== null) {
			for (let i = 0; i < upTo; i++) {
				let card = this.cards[i];
				card.x = this.x;
				card.y = this.y + i * this.spacing;
				if (this.hover && i == upTo - 1) {
					card.render(ctx, shade = true);
				} else {
					card.render(ctx);
				}
			}
		}


		/* render dragging */
		if (ctxF != null) {
			if (this.cards[upTo]) {
				/* draw shadow */
				ctxF.save();
				ctxF.roundRect(this.dx - this.ox, this.dy - this.oy, this.width, 140 + this.spacing * (this.cards.length - upTo - 1), this.width / 15);
				ctxF.shadowBlur = this.shadowLevel;
				ctxF.shadowOffsetX = this.shadowOffset;
				ctxF.shadowOffsetY = this.shadowOffset;
				ctxF.shadowColor = 'rgba(0,0,0,0.3)';
				ctxF.fill();
				ctxF.restore();
			}
	
			for (let i = upTo; i < this.cards.length; i++) {
				let card = this.cards[i];
				card.x = this.dx - this.ox;
				card.y = this.dy - this.oy + (i - upTo) * this.spacing;
				card.render(ctxF);
			}
		}
	}

	this.checkDrag = function (x, y) {
		let idx = -1;
		// check dragging index
		let pos = getMousePos(globalState.canvas, x, y);
		if (pos.x > this.x && pos.x < this.x + this.width && pos.y > this.y) {
			let selected = false;
			for (let i = 0; i < this.cards.length; i++) {
				if (pos.y < this.y + (i + 1) * this.spacing) {
					idx = i;
					selected = true;
					break;
				}
			}
			if (!selected
				&& this.cards.length > 0
				&& pos.y < this.y + (this.cards.length - 1) * this.spacing + 140) {
				idx = this.cards.length - 1;
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
				for (let i = idx + 1; i < this.cards.length; i++) {
					let current = this.cards[i]
					if (current.val !== prev.val - 1 || current.suit % 2 == prev.suit % 2) {
						return -1;
					}
					prev = this.cards[i];
				}
			}

			// ok to drag
			this.dragging = idx;
			// update drag offset x, y
			this.ox = x - this.x;
			this.oy = y - (this.y + this.spacing * this.dragging);
		}
		return idx;
	}

	this.checkDropOver = function (x, y) {
		let pos = getMousePos(globalState.canvas, x, y);
		if (pos.x > this.x && pos.x < this.x + this.width && pos.y > this.y) {
			if (this.cards.length < 1) {
				return pos.y < this.y + 140;
			}
			return pos.y < this.y + (this.cards.length - 1) * this.spacing + 140;
		}
	}
}
