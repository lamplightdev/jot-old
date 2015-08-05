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
    return [{
      name: 'blue',
      code: '#2196f3'
    }, {
      name: 'red',
      code: '#f44336'
    }, {
      name: 'purple',
      code: '#9c27b0'
    }, {
      name: 'teal',
      code: '#009688'
    }, {
      name: 'green',
      code: '#4caf50'
    }, {
      name: 'yellow',
      code: '#ffeb3b'
    }, {
      name: 'orange',
      code: '#ff9800'
    }, {
      name: 'brown',
      code: '#795548'
    }];
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

  static loadAll(loadJots = true) {
    return super.loadAll().then(groups => {
      const promises = [];

      if (loadJots) {
        groups.forEach(group => {
          promises.push(group.loadJots());
        });
      }

      return Promise.all(promises);
    });
  }
}

module.exports = Group;
