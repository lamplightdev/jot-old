'use strict';

const View = require('./view');

const Jot = require('../models/jot');

const PubSub = require('../utility/pubsub');

class ViewJots extends View {
  render(preRendered, params) {
    super.render(preRendered, params);

    this._subscriptions.push(PubSub.subscribe('update', (topic, args) => {
      console.log(args);

      if (args.changes && args.changes.length) {
        Jot.loadAll().then(jots => {
          this.render(false, {
            jots
          });
        });
      }
    }));
  }

}

module.exports = ViewJots;
