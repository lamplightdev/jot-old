'use strict';

const MainView = require('./main');

const Handlebars = require('handlebars/dist/handlebars.runtime');

class ViewNotes extends MainView {
  render(preRendered, params) {
    console.log('render');

    if (!preRendered) {
      var template = Handlebars.template(Jot.templates.notes);
      const view = document.getElementById('view');
      view.innerHTML = template(params);
    }

    this.initEvents();
  }

  initEvents() {
  }
}

module.exports = ViewNotes;
