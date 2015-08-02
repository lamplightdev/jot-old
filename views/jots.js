'use strict';

const View = require('./view');

const Jot = require('../models/jot');

const PubSub = require('../utility/pubsub');

class ViewJots extends View {
  constructor(container) {
    super(container);

    PubSub.subscribe('update', (topic, args) => {
      console.log(args);

      if (args.changes && args.changes.length) {
        Jot.loadAll().then(jots => {
          this.render(false, {
            jots
          });
        });
      }
    });
  }

}

module.exports = ViewJots;
