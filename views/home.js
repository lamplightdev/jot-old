'use strict';

const MainView = require('./main');

const Handlebars = require('handlebars/dist/handlebars.runtime');

class ViewHome extends MainView {
  render(preRendered, params) {
    console.log('render');

    if (!preRendered) {
      var template = Handlebars.template(JotApp.templates.home);
      const view = document.getElementById('view');
      view.innerHTML = template(params);
    }

    this.initEvents();
  }

  initEvents() {
  }
}

module.exports = ViewHome;
