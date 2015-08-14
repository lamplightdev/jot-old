'use strict';

const Routes = require('./routes');

const Jot = require('../models/jot');

class HomeRoutes extends Routes {
  constructor(router, prefix = '') {
    super(router, prefix);

    this._routes.home = {
      _path: '/',
      _method: ['get'],
      _action: () => {
        return Jot.getPercentageDone().then(done => {
          const segment = {
            one: 90,
            two: 90,
            three: 90,
            four: 90,
            done
          };

          if (done <= 25) {
            segment.one = 90 - (done / 25) * 90;
          } else {
            segment.one = 0;

            if (done <= 50) {
              segment.two = 90 - ((done - 25) / 25) * 90;
            } else {
              segment.two = 0;

              if (done <= 75) {
                segment.three = 90 - ((done - 50) / 25) * 90;
              } else {
                segment.three = 0;

                segment.four = 90 - ((done - 75) / 25) * 90;
              }
            }
          }

          return {
            segment
          };
        });
      }
    };
  }
}

module.exports = HomeRoutes;
