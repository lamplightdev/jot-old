class Touch {
  constructor(element) {
    this._element = element || null;

    this._xDown = null;
    this._yDown = null;

    this._registered = {
      left: [],
      right: [],
      up: [],
      down: [],
    };

    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
  }

  setElement(element) {
    this.destroy();

    this._element = element;

    this._element.addEventListener('touchstart', this.handleTouchStart, false);
    this._element.addEventListener('touchmove', this.handleTouchMove, false);
  }

  register(direction, fn) {
    this._registered[direction].push(fn);
  }

  handleTouchStart(evt) {
    this._xDown = evt.touches[0].clientX;
    this._yDown = evt.touches[0].clientY;
  }

  handleTouchMove(evt) {
    if ( ! this._xDown || ! this._yDown ) {
      return;
    }

    const xUp = evt.touches[0].clientX;
    const yUp = evt.touches[0].clientY;

    const xDiff = this._xDown - xUp;
    const yDiff = this._yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (xDiff > 0) {
        this._registered.left.forEach(fn => fn());
      } else {
        this._registered.right.forEach(fn => fn());
      }
    } else {
      if ( yDiff > 0 ) {
        this._registered.up.forEach(fn => fn());
      } else {
        this._registered.down.forEach(fn => fn());
      }
    }

    this._xDown = null;
    this._yDown = null;
  }

  destroy() {
    if (this._element) {
      this._element.removeEventListener('touchstart', this.handleTouchStart, false);
      this._element.removeEventListener('touchmove', this.handleTouchMove, false);
    }

    this._element = null;
  }
}

module.exports = Touch;
