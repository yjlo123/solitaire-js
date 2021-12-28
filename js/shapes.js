
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
