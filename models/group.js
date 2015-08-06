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

  get jotCount() {
    return this._jots.length;
  }

  get jotDoneCount() {
    return this._jots.filter(jot => !!jot.fields.done).length;
  }

  loadJots() {
    return Jot.loadForGroup(this.id).then(jots => {
      this._jots = jots;
      return this;
    });
  }

  static load(id, loadJots = true) {
    return super.load(id).then(group => {
      if (loadJots) {
        return group.loadJots().then(() => {
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
        groups.forEach(group => {
          promises.push(group.loadJots());
        });
      }

      return Promise.all(promises).then(() => {
        return this.order(groups, order, direction);
      });
    });
  }

  static order(groups, order = 'alpha', direction = 'asc') {

    switch (order) {
      case 'date':
        groups.sort((a, b) => {
          if (a.dateAdded > b.dateAdded) {
            return 1;
          }

          if (a.dateAdded < b.dateAdded) {
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
}

module.exports = Group;
