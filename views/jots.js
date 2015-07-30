'use strict';

const MainView = require('./main');

const Handlebars = require('handlebars/dist/handlebars.runtime');

const Jot = require('../models/jot');

const PubSub = require('../utility/pubsub');

class ViewJots extends MainView {
  constructor(template) {
    super(template);

    PubSub.subscribe('update', (topic, args) => {
      console.log(args);

      if (args.changes && args.changes.length) {
        Jot.loadAll().then(jots => {
          this.renderPartial('jots', false, {
            jots
          });
        });
      }
    });
  }

  render(preRendered, params) {
    console.log('render');

    if (!preRendered) {
      var template = Handlebars.template(JotApp.templates.jots);
      const view = document.getElementById('view');
      view.innerHTML = template(params);
    }

    this.initEvents();
  }

  renderPartial(name, preRendered, params) {
    console.log('render partial');

    if (!preRendered) {
      var template = Handlebars.template(JotApp.templates['jot-list']);
      const view = this._el.querySelector('.jot-list');
      view.outerHTML = template(params);
    }
  }

  initEvents() {
  }

}

module.exports = ViewJots;
