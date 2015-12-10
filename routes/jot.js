'use strict';

const Routes = require('./routes');

const Jot = require('../models/jot');

class JotRoutes extends Routes {
  constructor(router, prefix = '') {
    super(router, prefix);

    this._routes.all = {
      _path: '/',
      _method: ['get'],
      _action: params => {
        console.log(params.user);
        return Jot.loadAll(params.user, true, params.orderType, params.orderDirection);
      },
    };

    this._routes.add = {
      _path: '/',
      _method: ['post'],
      _action: params => {
        return new Jot({
          fields: {
            content: params.content,
            group: params.group,
            priority: params.priority,
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
        return Jot.remove(params.user, params.id).then(result => {
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
        return Jot.load(params.user, params.id).then(jot => {
          const currentFields = jot.fields;

          jot.fields = params.fields;

          if (typeof params.fields.done === 'undefined') {
            jot.fields.done = currentFields.done;
          }

          return jot.save(params.user);
        });
      },
    };
  }
}

module.exports = JotRoutes;
