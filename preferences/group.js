const Preferences = require('./preferences');

const Jot = require('../models/Jot');

class GroupPreferences extends Preferences {
  constructor() {
    super();

    this._order = this.getItem('order');

    if (!this._order || !this._order.type || !this._order.direction) {
      this._order = {
        type: 'date',
        direction: 'desc'
      };
    }
  }

  getOrder() {
    return this.getItem('order');
  }

  setOrder(type, direction) {
    this._order.type = type;
    this._order.direction = direction;

    this.setItem('order', this._order);
  }

  order(jots) {
    return Jot.order(jots, this._order.type, this._order.direction);
  }
}

module.exports = GroupPreferences;
