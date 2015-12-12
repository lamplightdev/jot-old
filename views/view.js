'use strict';

const Handlebars = require('handlebars/dist/handlebars.runtime');
const PubSub = require('../utility/pubsub');

class View {
  constructor(container) {
    this._container = container;

    this._subscriptions = [];
    this._documentListeners = {};
    this._widgets = [];

    this._lastParams = null;
  }

  // tidy this up?
  get _el() {
    return this._container._el;
  }

  get lastParams() {
    return this._lastParams;
  }

  render(preRendered, params) {
    this.cleanup();

    if (!preRendered) {
      const template = Handlebars.template(this._container._templates[this._getTemplate()]);
      this._container.update(this, template(params));
    }

    this.initEvents(params);

    this._lastParams = params;
  }

  renderPartial(name, params) {
    console.log('render partial', name);

    const template = Handlebars.template(this._container._partials[name]);
    const view = this._el.querySelector('.partial-' + name);
    view.outerHTML = template(params);

    this._lastParams = params;

    return this._el.querySelector('.partial-' + name);
  }

  _getTemplate() {
    return this.constructor.name.toLowerCase().substring(4);
  }

  _addDocumentListener(name, type, fn) {
    if (!this._documentListeners[name]) {
      this._documentListeners[name] = {
        type,
        fn: fn.bind(this),
      };
    }

    document.addEventListener(type, this._documentListeners[name].fn);
  }

  cleanup() {
    // console.log('view cleaup', this);

    for (const sub of this._subscriptions) {
      PubSub.unsubscribe(sub);
    }

    for (const lname in this._documentListeners) {
      const listener = this._documentListeners[lname];
      document.removeEventListener(listener.type, listener.fn);
    }

    this.cleanupWidgets();
  }

  initEvents() {
    this.initWidgets(this._el);
  }

  registerWidget(Widget) {
    this._widgets.push(new Widget());
  }

  initWidgets(el) {
    this._widgets.forEach(widget => {
      widget.initEvents(el);
    });
  }

  cleanupWidgets() {
    this._widgets.forEach(widget => {
      widget.cleanup();
    });
  }

}

module.exports = View;
