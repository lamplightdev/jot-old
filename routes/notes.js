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

    this._routes.save = {
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
        Jot.remove(params.id).then(result => {
          return true;
        });
      }
    };
  }
}

module.exports = NotesRoutes;
