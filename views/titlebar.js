const View = require('./view');

const ListOrder = require('./list-order');
const PubSub = require('../utility/pubsub');

class TitleBarView extends View {
  constructor(container) {
    super(container);

    this.registerWidget(ListOrder);
  }

  render(preRendered, params) {
    super.render(preRendered, params);

    this._subscriptions.push(PubSub.subscribe('routeChanged', (topic, args) => {
      //console.log('test');
      this.renderPartial('titlebar-title', args);
      this.renderPartial('titlebar-tabs', args);

      this.updateSorting(args);
    }));
  }

  renderPartial(name, params) {
    const el = super.renderPartial(name, params);

    switch (name) {
      case 'list-order':
        this.initWidgets(el);
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

module.exports = TitleBarView;
