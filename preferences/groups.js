const Preferences = require('./preferences');

const Group = require('../models/group');

class GroupsPreferences extends Preferences {
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

  order(groups) {
    return Group.order(groups, this._order.type, this._order.direction);
  }
}

module.exports = GroupsPreferences;
