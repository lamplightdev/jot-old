'use strict';

const Model = require('./model');
const Jot = require('./jot');

class Group extends Model {

  constructor(members) {
    super(members, [
      'name',
      'colour',
    ]);

    this._jots = [];
  }

  static getColours() {
    return [{
      value: 'blue',
      name: 'Blue',
    }, {
      value: 'red',
      name: 'Red',
    }, {
      value: 'teal',
      name: 'Teal',
    }, {
      value: 'yellow',
      name: 'Yellow',
    }, {
      value: 'orange',
      name: 'Orange',
    }, {
      value: 'brown',
      name: 'Brown',
    }];
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
    }
    return this.jots.filter(jot => !jot.fields.done);
  }

  get jotCount() {
    return this._jots.length;
  }

  get jotDoneCount() {
    return this._jots.filter(jot => !!jot.fields.done).length;
  }

  loadJots(user, order = 'alpha', direction = 'asc') {
    return Jot.loadForGroup(user, this.id, order, direction).then(jots => {
      this._jots = jots;
      return this;
    });
  }

  static load(user, id, loadJots = true, jotOrder = 'alpha', jotDirection = 'asc') {
    return super.load(user, id).then(group => {
      if (loadJots) {
        return group.loadJots(user, jotOrder, jotDirection).then(() => {
          return group;
        });
      }
      return group;
    });
  }

  static loadAll(user, loadJots = true, order = 'alpha', direction = 'asc') {
    return super.loadAll(user).then(groups => {
      const promises = [];

      if (loadJots) {
        promises.push(Jot.loadForGroups(user, groups));
      }

      return Promise.all(promises).then(() => {
        return this.order(groups, order, direction);
      });
    });
  }

  static loadForJots(user, jots) {
    return Promise.resolve().then(() => {
      const groupIds = jots.map(jot => jot.fields.group);
      return user.db.allDocs({
        descending: true,
        keys: groupIds,
        include_docs: true,
      }).then(result => {
        const jotGroups = {};

        result.rows.forEach(row => {
          if (row.doc) {  // .doc won't exist if for some reason this group has been deleted but the jot still exists (how?)
            jotGroups[row.doc._id] = new this(row.doc);
          }
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

  static remove(user, id) {
    return super.remove(user, id).then(() => {
      return Jot.loadForGroup(user, id).then(jots => {
        const docs = jots.map(jot => {
          return {
            _id: jot.id,
            _rev: jot.rev,
            _deleted: true,
          };
        });

        return user.db.bulkDocs(docs).then(() => {
          return true;
        });
      });
    });
  }

  static importFromLocal(user) {
    return Promise.resolve().then(() => {
      if (typeof PouchDB === 'undefined') { //server
        return false;
      }

      //load local db
      require('../db/db')({
        dbName: 'jot-local',
      }, 'local');

      return this.loadAll().then(groups => {
        //restore main db
        require('../db/db')(null, 'main');

        return groups;
      });
    });
  }

  static removeFromLocal() {
    return Promise.resolve().then(() => {
      if (typeof PouchDB === 'undefined') { //server
        return false;
      }

      //load local db
      require('../db/db')({
        dbName: 'jot-local'
      }, 'local');

      return this.loadAll().then(groups => {
        const promises = [];
        groups.forEach(group => {
          promises.push(Group.remove(group.id));
        });

        return Promise.all(promises);
      }).then(() => {
        //restore main db
        require('../db/db')(null, 'main');

        return true;
      });
    });
  }
}

module.exports = Group;
