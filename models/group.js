const Model = require('./model');
const Jot = require('./jot');

class Group extends Model {

  constructor(members) {
    super(members, [
      'name'
    ]);

    this.getJots();
  }

  getJots() {
    return Jot.getForGroup(this.id);
  }
}

module.exports = Group;
