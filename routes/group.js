'use strict';

const Routes = require('./routes');

const Group = require('../models/group');

class GroupRoutes extends Routes {
  constructor(router, prefix = '') {
    super(router, prefix);

    this._routes.all = {
      _path: '/',
      _method: ['get'],
      _action: params => {
        return Group.loadAll(params.user, true, params.orderType, params.orderDirection);
      },
    };

    this._routes.view = {
      _path: '/:id/:status?',
      _method: ['get'],
      _action: params => {
        return Group.load(params.user, params.id, true, params.orderType, params.orderDirection).then(group => {
          if (params.postLoadGroup) {
            params.postLoadGroup(group);
          }

          group._jots = group.getJots(params.done);
          return group;
        });
      },
    };

    this._routes.add = {
      _path: '/',
      _method: ['post'],
      _action: params => {
        return new Group({
          fields: {
            name: params.name,
            colour: params.colour,
          },
        }).save(params.user);
      },
    };

    this._routes.delete = {
      _path: '/:id',
      _method: ['post'],
      _action: params => {
        if (params.action !== 'delete') {
          return Promise.reject();  // will cascade down to update etc.
        }
        return Group.remove(params.user, params.id).then(result => {
          return true;
        });
      },
    };

    this._routes.update = {
      _path: '/:id',
      _method: ['post'],
      _action: params => {
        if (params.action !== 'update') {
          return Promise.reject();
        }
        return Group.load(params.user, params.id).then(group => {
          group.fields = params.fields;

          return group.save(params.user);
        });
      },
    };
  }
}

module.exports = GroupRoutes;
