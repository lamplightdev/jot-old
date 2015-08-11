const Model = require('./model');

class Jot extends Model {

  constructor(members) {
    super(members, [
      'content',
      'group',
      'done',
      'priority'
    ]);

    this._group = null;
  }

  static getPriorities() {
    return [
      '2',
      '1',
      '0'
    ];
  }

  get priorities() {
    return this.constructor.getPriorities();
  }

  get group() {
    return this._group;
  }

  get groupName() {
    if (this._group) {
      return this._group.fields.name;
    } else {
      return '-';
    }
  }

  loadGroup() {
    return Promise.resolve().then(() => {
      const Group = require('./group');

      return Group.load(this.fields.group, false).then(group => {
        this._group = group;
        return this;
      });
    });
  }

  static load(id, loadGroup = true) {
    return super.load(id).then(jot => {
      if (loadGroup) {
        return jot.loadGroup().then(() => {
          return jot;
        });
      } else {
        return jot;
      }
    });
  }

  static loadAll(loadGroups = true, order = 'date', direction = 'desc') {
    return super.loadAll().then(jots => {
      const Group = require('./group');

      const promises = [];

      if (loadGroups) {
        promises.push(Group.loadForJots(jots));
      }

      return Promise.all(promises).then(() => {
        return this.order(jots, order, direction);
      });
    });
  }

  static order(jots, sortOrder = 'date', sortDirection = 'desc') {

    switch (sortOrder) {
      case 'date':
        jots.sort((a, b) => {
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
        jots.sort((a, b) => {
          if (a.fields.content.toLowerCase() > b.fields.content.toLowerCase()) {
            return 1;
          }

          if (a.fields.content.toLowerCase() < b.fields.content.toLowerCase()) {
            return -1;
          }

          return 0;
        });

        break;
      case 'priority':
        jots.sort((a, b) => {
          if (a.fields.priority > b.fields.priority) {
            return 1;
          }

          if (a.fields.priority < b.fields.priority) {
            return -1;
          }

          return 0;
        });

        break;
    }

    if (sortDirection === 'desc') {
      jots.reverse();
    }

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
  }

  static loadForGroup(groupId, order = 'date', direction = 'desc') {
    return Promise.resolve().then(() => {
      const db = require('../db/db')();

      return db.query('index/group', {
        descending: true,
        key: groupId,
        include_docs: true
      }).then(result => {
        const jots = [];

        result.rows.forEach(row => {
          jots.push(new this(row.doc));
        });

        return this.order(jots, order, direction);
      });
    });
  }

  static loadForGroups(groups, order = 'date', direction = 'desc') {
    return Promise.resolve().then(() => {
      const db = require('../db/db')();

      const groupIds = groups.map(group => group.id);

      return db.query('index/group', {
        descending: true,
        keys: groupIds,
        include_docs: true
      }).then(result => {
        const groupJots = {};

        groupIds.forEach(groupId => {
          groupJots[groupId] = [];
        });

        result.rows.forEach(row => {
          groupJots[row.doc.fields.group].push(new this(row.doc));
        });

        groups.forEach(group => {
          group._jots = groupJots[group.id];
        });
      });
    });
  }
}

module.exports = Jot;
