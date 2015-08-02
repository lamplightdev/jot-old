'use strict';

const Handlebars = require('handlebars/dist/handlebars.runtime');

class View {
  constructor(container) {
    this._container = container;

    this._widgets = [];
  }

  //tidy this up?
  get _el() {
    return this._container._el;
  }

  render(preRendered, params) {
    if (!preRendered) {
      var template = Handlebars.template(this._container._templates[this._getTemplate()]);
      this._container.update(this, template(params));
    }

    this.initEvents();
  }

  renderPartial(name, params) {
    console.log('render partial');

    var template = Handlebars.template(this._container._partials[name]);
    const view = this._el.querySelector('.partial-' + name);
    view.outerHTML = template(params);
  }

  _getTemplate() {
    return this.constructor.name.toLowerCase().substring(4);
  }

  cleanup() {
    console.log('view cleaup', this);
    this.cleanupWidgets();
  }

  initEvents() {
    this.initWidgets();
  }

  registerWidget(Widget, template) {
    this._widgets.push(new Widget(template, this._container));
  }

  initWidgets() {
    this._widgets.forEach(widget => {
      widget.initEvents();
    });
  }

  cleanupWidgets() {
    this._widgets.forEach(widget => {
      widget.cleanup();
    });
  }

}

module.exports = View;
