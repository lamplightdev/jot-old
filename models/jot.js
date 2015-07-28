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

  static getForGroup(groupId) {
    const db = require('../db/db')();

    var ddoc = {
      _id: '_design/index',
      views: {
        group: {
          map: doc => {
            if (doc.fields.group) {
              emit(doc.fields.group);
            }
          }.toString()
        }
      }
    };

    return db.put(ddoc).catch(err => {
      if (err.status !== 409) {
        throw err;
      }
    }).then(() => {
      return db.query('index/group', {
        endkey: this.getRefName() + '-',
        startkey: this.getRefName() + '-\uffff',
        descending: true,
        key: groupId,
        include_docs: true
      });
    }).then(result => {
      console.log('fetch: ', result);
    });
  }
}

module.exports = Jot;
