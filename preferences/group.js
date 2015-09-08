const Preferences = require('./preferences');

const Jot = require('../models/Jot');

class GroupPreferences extends Preferences {
  constructor() {
    super();

    this._order = {
      type: 'date',
      direction: 'desc'
    };
  }

  getOrder() {
    return this._order;
  }

  setOrder(type, direction) {
    this._order.type = type;
    this._order.direction = direction;
  }

  order(jots) {
    return Jot.order(jots, this._order.type, this._order.direction);
  }
}

module.exports = GroupPreferences;
