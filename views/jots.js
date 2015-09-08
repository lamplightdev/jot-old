'use strict';

const View = require('./view');

const Jot = require('../models/jot');

const JotsPreferences = require('../preferences/jots');

const PubSub = require('../utility/pubsub');

class ViewJots extends View {
  constructor(container) {
    super(container);

    this._preferences = new JotsPreferences();
  }

  render(preRendered, params) {
    params.jots = this._preferences.order(params.jots);

    super.render(preRendered, params);

    this._subscriptions.push(PubSub.subscribe('update', (topic, args) => {
      if (args.changes && args.changes.length) {
        Jot.loadAll().then(jots => {
          this.render(false, {
            jots
          });
        });
      }
    }));

    this._subscriptions.push(PubSub.subscribe('orderChanged', (topic, args) => {
      this._preferences.setOrder(args.type, args.direction);

      const params = this.lastParams;
      this.render(false, params);
    }));
  }

}

module.exports = ViewJots;
