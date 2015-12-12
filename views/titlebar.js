const View = require('./view');

const ListOrder = require('./list-order');
const PubSub = require('../utility/pubsub');

const Touch = require('../utility/touch');

class ViewTitleBar extends View {
  constructor(container) {
    super(container);

    this.registerWidget(ListOrder);

    this._touchHandler = new Touch();
    this._touchHandler.register('left', (this._closeNav).bind(this));
    this._touchHandler.register('right', (this._openNav).bind(this));
  }

  render(preRendered, params) {
    super.render(preRendered, params);

    this._subscriptions.push(PubSub.subscribe('routeChanged', (topic, args) => {
      this.renderPartial('titlebar-title', args);
      this.renderPartial('titlebar-tabs', args);

      this.updateSorting(args);
    }));

    this._touchHandler.setElement(this._el);
  }

  renderPartial(name, params) {
    const el = super.renderPartial(name, params);

    switch (name) {
    case 'list-order':
      this.initWidgets(el);
      break;
    default:
      break;
    }
  }

  initEvents() {
    super.initEvents();

    this._nav = this._el.querySelector('nav');
    this._navOverlay = this._el.querySelector('.md-nav-overlay');
    this._btnMenuOpen = this._el.querySelector('.md-btn-menu');
    this._btnMenuClose = this._el.querySelector('.md-btn-menu.close');
    this._links = this._el.querySelectorAll('.md-nav-body a');

    this._btnMenuOpen.addEventListener('click', event => {
      event.preventDefault();
      this._openNav();
    });

    this._btnMenuClose.addEventListener('click', event => {
      event.preventDefault();
      this._closeNav();
    });

    for (let i = 0; i < this._links.length; i++) {
      this._links[i].addEventListener('click', () => this._closeNav());
    }

    this._navOverlay.addEventListener('click', () => {
      this._closeNav();
    });
  }

  cleanup() {
    super.cleanup();

    this._touchHandler.destroy();
  }

  _openNav() {
    this._nav.classList.add('show');
    this._navOverlay.classList.add('show');
  }

  _closeNav() {
    this._nav.classList.remove('show');
    this._navOverlay.classList.remove('show');
  }

  updateSorting(args) {
    this.renderPartial('list-order', args);
  }

}

module.exports = ViewTitleBar;
