let TheBug = function () {
    this.c = document.getElementById('canvas-l')
    this.ctx = this.c.getContext('2d')
    this.h = this.c.height
    this.w = this.c.width

    this.width = 55;
    this.height = 47;

    this.x = Math.floor(Math.random() * (800-this.width));
    this.y = Math.floor(Math.random() * (650-this.height));
    this.direction = 0;

    this.moveCount = 0;
    this.moveTargetCount = 20;

    this.frame = 0;

    this.img1 = new Image(55, 47);
    this.img1.src = './img/0.png';

    this.img2 = new Image(55, 47);
    this.img2.src = './img/1.png';

    this.imgs = [this.img1, this.img2];

    this.dirOffset = {
        '0': [0, -1],
        '90': [1, 0],
        '180': [0, 1],
        '270': [-1, 0]
    }

    this.randomDirection = function() {
        let dir = Math.round(Math.random())===0?-1:1;
        this.direction = Math.abs(this.direction + 90*dir) % 360;
        this.moveTargetCount = Math.floor(Math.random() * 100);
    }

    this.move = function() {
        if (this.x > 800-this.width) {
            this.direction = 270;
        }
        if (this.y > 650-this.height) {
            this.direction = 0;
        }
        if (this.y < 0) {
            this.direction = 180;
        }
        if (this.x < 0) {
            this.direction = 90;
        }

        this.x += 4 * this.dirOffset[this.direction+''][0];
        this.y += 4 * this.dirOffset[this.direction+''][1];
        this.moveCount += 1;
    }

    this.clear = function() {
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.beginPath();
    }
    
    this.render = function() {
        this.frame += 1;

        this.ctx.clearRect(0, 0, w, h);
        this.ctx.save();
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;

        let angle = this.direction * Math.PI/180;
        this.ctx.translate( this.x+this.width/2, this.y+this.height/2 );
        this.ctx.rotate(angle);
        this.ctx.translate(-this.x-this.width/2, -this.y-this.height/2);
        this.ctx.drawImage(this.imgs[this.frame%2], this.x, this.y);
        this.ctx.rotate(-angle);
        this.ctx.restore();
    }
}

let BUG = {
    theBug: new TheBug(),

    drawFn: null,
    clearFn: null,
    stopped: true,
    timerID: null,

    animStartTime: -1
}

function animateBug(time) {
    if (BUG.stopped) {
        BUG.theBug.clear();
        return;
    }

    if (BUG.animStartTime === -1) {
		BUG.animStartTime = time;
	}
   
    let timeUnits = (time - BUG.animStartTime) / 10;
    if (timeUnits > 10) {
        BUG.theBug.move();
        BUG.theBug.render();
        BUG.animStartTime = time;
    }
    if (BUG.theBug.moveCount > BUG.theBug.moveTargetCount) {
        BUG.theBug.moveCount = 0;
        BUG.theBug.randomDirection();
    }
    requestAnimationFrame(animateBug)
}

function bugStart() {
    BUG.stopped = false;
    requestAnimationFrame(animateBug);
}

function bugStop() {
    BUG.stopped = true;
}
