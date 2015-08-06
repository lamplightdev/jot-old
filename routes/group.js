'use strict';

const Routes = require('./routes');

const Group = require('../models/group');

class GroupRoutes extends Routes {
  constructor(router, prefix = '') {
    super(router, prefix);

    this._routes.all = {
      _path: '/',
      _method: ['get'],
      _action: () => {
        return Group.loadAll();
      }
    };

    this._routes.view = {
      _path: '/:id',
      _method: ['get'],
      _action: params => {
        return Group.load(params.id);
      }
    };

    this._routes.add = {
      _path: '/',
      _method: ['post'],
      _action: params => {
        return new Group({
          fields: {
            name: params.name,
            colour: params.colour
          }
        }).save();
      }
    };

    this._routes.delete = {
      _path: '/:id',
      _method: ['post'],
      _action: params => {
        if (params.action !== 'delete') {
          return Promise.reject();  //will cascade down to update etc.
        } else {
          return Group.remove(params.id).then(result => {
            return true;
          });
        }
      }
    };

    this._routes.update = {
      _path: '/:id',
      _method: ['post'],
      _action: params => {
        if (params.action !== 'update') {
          return Promise.reject();
        } else {
          return Group.load(params.id).then(group => {
            group.fields = params.fields;

            return group.save();
          });
        }
      }
    };
  }
}

module.exports = GroupRoutes;
