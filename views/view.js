'use strict';

const Handlebars = require('handlebars/dist/handlebars.runtime');

class View {
  constructor(template, el = {}) {
    this._template = template;
    this._el = el;

    this._widgets = [];
  }

  render(preRendered, params) {
    if (!preRendered) {
      var template = Handlebars.template(this._template);
      this._el.innerHTML = template(params);
    }

    this.initEvents();
  }

  initEvents() {
    this.initWidgets();
  }

  registerWidget(Widget, template) {
    this._widgets.push(new Widget(template, this._el));

    return this._widgets.length - 1;
  }

  unregisterWidget(widgetIndex) {
    this._widgets.splice(widgetIndex, 1);
  }

  initWidgets() {
    this._widgets.forEach(widget => {
      widget.initEvents();
    });
  }

}

module.exports = View;
