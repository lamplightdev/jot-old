const Preferences = require('./preferences');

const Group = require('../models/group');

class GroupsPreferences extends Preferences {
  constructor() {
    super();

    this._order = {
      type: 'alpha',
      direction: 'asc'
    };
  }

  getOrder() {
    return this._order;
  }

  setOrder(type, direction) {
    this._order.type = type;
    this._order.direction = direction;
  }

  order(groups) {
    return Group.order(groups, this._order.type, this._order.direction);
  }
}

module.exports = GroupsPreferences;
