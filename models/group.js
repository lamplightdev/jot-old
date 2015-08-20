const Model = require('./model');
const Jot = require('./jot');

class Group extends Model {

  constructor(members) {
    super(members, [
      'name',
      'colour'
    ]);

    this._jots = [];
  }

  static getColours() {
    return [
      'blue',
      'red',
      'teal',
      'yellow',
      'orange',
      'brown'
    ];
  }

  get colours() {
    return this.constructor.getColours();
  }

  get jots() {
    return this._jots;
  }

  set jots(jots) {
    this._jots = jots;
  }

  getJots(done = null) {
    if (done === null) {
      return this.jots;
    } else if (done) {
      return this.jots.filter(jot => !!jot.fields.done);
    } else {
      return this.jots.filter(jot => !jot.fields.done);
    }
  }

  get jotCount() {
    return this._jots.length;
  }

  get jotDoneCount() {
    return this._jots.filter(jot => !!jot.fields.done).length;
  }

  loadJots(order = 'alpha', direction = 'asc') {
    return Jot.loadForGroup(this.id, order, direction).then(jots => {
      this._jots = jots;
      return this;
    });
  }

  static load(id, loadJots = true, jotOrder = 'alpha', jotDirection = 'asc') {
    return super.load(id).then(group => {
      if (loadJots) {
        return group.loadJots(jotOrder, jotDirection).then(() => {
          return group;
        });
      } else {
        return group;
      }
    });
  }

  static loadAll(loadJots = true, order = 'alpha', direction = 'asc') {
    return super.loadAll().then(groups => {
      const promises = [];

      if (loadJots) {
        promises.push(Jot.loadForGroups(groups));
      }

      return Promise.all(promises).then(() => {
        return this.order(groups, order, direction);
      });
    });
  }

  static loadForJots(jots) {
    return Promise.resolve().then(() => {
      const db = require('../db/db')();

      const groupIds = jots.map(jot => jot.fields.group);

      return db.allDocs({
        descending: true,
        keys: groupIds,
        include_docs: true
      }).then(result => {
        const jotGroups = {};

        result.rows.forEach(row => {
          jotGroups[row.doc._id] = new this(row.doc);
        });

        jots.forEach(jot => {
          jot._group = jotGroups[jot.fields.group];
        });
      });
    });
  }

  static order(groups, order = 'alpha', direction = 'asc') {

    switch (order) {
      case 'date':
        groups.sort((a, b) => {
          if (a._dateAdded > b._dateAdded) {
            return 1;
          }

          if (a._dateAdded < b._dateAdded) {
            return -1;
          }

          return 0;
        });

        break;
      case 'alpha':
        groups.sort((a, b) => {
          if (a.fields.name.toLowerCase() > b.fields.name.toLowerCase()) {
            return 1;
          }

          if (a.fields.name.toLowerCase() < b.fields.name.toLowerCase()) {
            return -1;
          }

          return 0;
        });

        break;
    }

    if (direction === 'desc') {
      groups.reverse();
    }

    return groups;
  }

  static remove(id) {
    return super.remove(id).then(() => {
      const db = require('../db/db')();

      return Jot.loadForGroup(id).then(jots => {
        const docs = jots.map(jot => {
          return {
            _id: jot.id,
            _rev: jot.rev,
            _deleted: true
          };
        });

        return db.bulkDocs(docs).then(() => {
          return true;
        });
      });
    });
  }
}

module.exports = Group;
