const Preferences = require('./preferences');

const Jot = require('../models/Jot');

class GroupPreferences extends Preferences {
  constructor() {
    super();

    this._order = this.getOrder();
  }

  getOrder() {
    let order = this.getItem('order');

    if (!order || !order.type || !order.direction) {
      order = {
        type: 'date',
        direction: 'desc'
      };
    }

    this._order = order;

    return order;
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
