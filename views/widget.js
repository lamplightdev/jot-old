class Widget {

  constructor(parentView) {
    this._parentView = parentView;
  }

  initEvents() {

  }

  cleanup() {
    console.log('widget cleaup', this);
  }
}

module.exports = Widget;
