
let Card = function (val, suit = -1, x = 0, y = 0, width = 100, height = 140) {
	this.x = x;
	this.y = y;
    this.xOff = 0;
	this.width = width;
	this.height = height;
	this.val = val;
	this.suit = suit;
	this.dealt = false;

    this.flipStartTime = -1
    this.lastFrameUnit = 0

	this.revealed = true;
    this.skewRight = 0;
    this.skewLeft = 0;

    let that = this;

    this.reveal = function (state) {
        this.redrawFunc = state.redraw;
        requestAnimationFrame(that.animFlip);
    }

    this.animFlip = function (time) {
        if (that.flipStartTime === -1) {
            that.flipStartTime = time;
        }
        let timeUnits = Math.ceil((time - that.flipStartTime) / 20);
        if (timeUnits > 21) {
            // flip done
            return;
        }

        if (timeUnits === that.lastFrameUnit) {
            return requestAnimationFrame(that.animFlip);
        }
        that.lastFrameUnit = timeUnits;

        if (timeUnits < 11) {
            
            if (that.width > 4) {
                that.skewRight += 1;
                //console.log('right', that.skewRight)
                that.xOff += 4
                that.width -= 8
            }
            that.redrawFunc();
        } else if (timeUnits < 21) {
            that.revealed = true;
            that.skewRight = 0;
            
            if (that.width < 100) {
                that.skewLeft = 10 - Math.floor(timeUnits-11);
                //console.log('left', that.skewLeft)
                that.xOff -= 4
                that.width += 8
            }
            that.redrawFunc();
        } else {
            that.skewLeft = 0;
            that.xOff = 0;
            that.width = 100;
            that.redrawFunc();
        }

        //console.log('frame', timeUnits);
        requestAnimationFrame(that.animFlip);
    }

    this.getX = function() {
        return this.x + this.xOff;
    }

	this.render = function (ctx, shade = false) {
		ctx.save();
		ctx.roundSkewRect(this.getX(), this.y, this.width, this.height, this.width / 15, this.skewRight, this.skewLeft);
		if (shade) {
			ctx.fillStyle = '#ddd';
		} else {
			ctx.fillStyle = '#eee';
		}

		if (this.dealt) {
			ctx.save();
			ctx.shadowBlur = 3;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 1;
			ctx.shadowColor = 'rgba(0,0,0,0.3)';
			ctx.fill();
			ctx.restore();
		} else {
			ctx.fill();
		}
		ctx.strokeStyle = '#bbb';
		ctx.stroke();

		if (!this.revealed) {
            // show card back
			let padding = Math.max(Math.floor(this.width / 15), 4);
            let paddingRatio = padding / 7;
			ctx.roundSkewRect(this.getX() + padding, this.y + padding, this.width - padding * 2, 140 - padding * 2, (this.width - padding * 2) / 15, this.skewRight*paddingRatio, this.skewLeft*paddingRatio);
			ctx.fillStyle = '#77B97F';
			ctx.fill();
		}
		/* text */
		else if (this.val >= 0) {
			// number card
			let fontSize = (this.width / 8)
			ctx.font = fontSize + "pt sans-serif";
			if (globalState.colorBlind) {
				ctx.beginPath();
				if (this.suit % 2 === 0) {
					let coor = COLORBLIND_CIRCLE;
					if (globalState.lang === 1) {
						coor = COLORBLIND_CIRCLE_CN;
					}
					ctx.arc(this.x + coor[0], this.y + coor[1], coor[2], 0, 2 * Math.PI);
				} else {
					let coor = COLORBLIND_RECT;
					if (globalState.lang === 1) {
						coor = COLORBLIND_RECT_CN;
					}
					ctx.rect(this.x + coor[0], this.y + coor[1], coor[2], coor[3]);
				}
				ctx.fillStyle = SUIT_COLORS_BLIND[this.suit % 2];
				ctx.fill();
				ctx.fillStyle = 'white';
			} else {
				ctx.fillStyle = SUIT_COLORS[this.suit % 2];
			}
			let textOffset = CARD_VALUE_OFFSET[this.val];
			let cardValSet = CARD_VAL;
			if (globalState.lang === 1) {
				cardValSet = CARD_VAL_CN;
				textOffset = [0, 0];
			}

			ctx.fillText(cardValSet[this.val], this.getX() + 10 + textOffset[0], this.y + 25);
			// ctx.font = (this.width/10)+"pt sans-serif";
			// ctx.fillText(SUITS[this.suit], this.x+20, this.y+24);
		} else {
			// dragon card
			ctx.font = (this.width / 8) + "pt sans-serif";
			ctx.fillStyle = '#555';
			ctx.fillText(globalState.dragonSymbol, this.x + 10, this.y + 25);
		}
		ctx.restore();
	}
}
