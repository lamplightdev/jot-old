'use strict';

const View = require('./view');

const Jot = require('../models/jot');

const PubSub = require('../utility/pubsub');

class ViewJots extends View {
  render(preRendered, params) {
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
      const params = this.lastParams;
      params.jots = Jot.order(params.jots, args.type, args.direction);
      this.render(false, params);
    }));
  }

}

module.exports = ViewJots;
