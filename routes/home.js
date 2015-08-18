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
        return Jot.getPercentageDone().then(stats => {
          const segments = {
            one: 90,
            two: 90,
            three: 90,
            four: 90
          };

          if (stats.percent <= 25) {
            segments.one = 90 - (stats.percent / 25) * 90;
          } else {
            segments.one = 0;

            if (stats.percent <= 50) {
              segments.two = 90 - ((stats.percent - 25) / 25) * 90;
            } else {
              segments.two = 0;

              if (stats.percent <= 75) {
                segments.three = 90 - ((stats.percent - 50) / 25) * 90;
              } else {
                segments.three = 0;

                segments.four = 90 - ((stats.percent - 75) / 25) * 90;
              }
            }
          }

          stats.segments = segments;

          if (stats.numGroups > 0) {
            const plural = stats.numGroups === 1 ? '' : 's';
            stats.message = `${stats.percent}% done in ${stats.numGroups} list${plural}`;
          } else {
            stats.message = 'No lists. Add one now';
          }

          return stats;
        });
      }
    };
  }
}

module.exports = HomeRoutes;
