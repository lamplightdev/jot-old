'use strict';

const Routes = require('./routes');

const Jot = require('../models/jot');

class NotesRoutes extends Routes {
  constructor(router, prefix = '') {
    super(router, prefix);

    this._routes.all = {
      _path: '/',
      _method: ['get'],
      _action: () => {
        return Promise.resolve();
      }
    };

    this._routes.add = {
      _path: '/',
      _method: ['post'],
      _action: params => {
        return new Jot({
          fields: {
            content: params.content
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
          return Jot.remove(params.id).then(result => {
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
          return Jot.load(params.id).then(jot => {
            jot.fields = params.fields;
            return jot.save();
          });
        }
      }
    };
  }
}

module.exports = NotesRoutes;
