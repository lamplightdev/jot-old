const Model = require('./model');

class Group extends Model {

  constructor(members) {
    super(members, [
      'name'
    ]);
  }
}

module.exports = Group;
