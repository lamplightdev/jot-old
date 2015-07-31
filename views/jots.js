'use strict';

const View = require('./view');

const Handlebars = require('handlebars/dist/handlebars.runtime');

const Jot = require('../models/jot');

const PubSub = require('../utility/pubsub');

class ViewJots extends View {
  constructor(container) {
    super(container);

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

  renderPartial(name, preRendered, params) {
    console.log('render partial');

    if (!preRendered) {
      var template = Handlebars.template(this._container._partials['jot-list']);
      const view = this._el.querySelector('.jot-list');
      view.outerHTML = template(params);
    }
  }

  initEvents() {
  }

}

module.exports = ViewJots;
