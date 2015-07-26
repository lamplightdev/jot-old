const Model = require('./model');

class Jot extends Model {

  constructor(members) {
    super(members, [
      'content',
      'group',
      'done'
    ]);
  }

  static loadAll() {
    return super.loadAll().then(jots => {
      const undoneJots = [];
      const doneJots = [];

      jots.forEach(jot => {
        if (jot.isDone()) {
          doneJots.push(jot);
        } else {
          undoneJots.push(jot);
        }
      });

      return undoneJots.concat(doneJots);
    });
  }
}

module.exports = Jot;
