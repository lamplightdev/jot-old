const Preferences = require('./preferences');

const Group = require('../models/group');

class GroupsPreferences extends Preferences {
  constructor() {
    super();

    this._order = this.getItem('order');

    if (!this._order || !this._order.type || !this._order.direction) {
      this._order = {
        type: 'alpha',
        direction: 'asc'
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

  order(groups) {
    return Group.order(groups, this._order.type, this._order.direction);
  }
}

module.exports = GroupsPreferences;
