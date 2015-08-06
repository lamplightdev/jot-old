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

  static loadAll(loadGroups = true) {
    return super.loadAll().then(jots => {
      const promises = [];

      if (loadGroups) {
        jots.forEach(jot => {
          promises.push(jot.loadGroup());
        });
      }

      return Promise.all(promises).then(() => {
        return this.orderJots(jots);
      });
    });
  }

  static orderJots(jots) {
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

  static loadForGroup(groupId) {
    return Promise.resolve().then(() => {
      const db = require('../db/db')();

      return db.query('index/group', {
        endkey: this.getRefName() + '-',
        startkey: this.getRefName() + '-\uffff',
        descending: true,
        key: groupId,
        include_docs: true
      }).then(result => {
        const jots = [];

        result.rows.forEach(row => {
          jots.push(new this(row.doc));
        });

        return this.orderJots(jots);
      });
    });
  }
}

module.exports = Jot;
