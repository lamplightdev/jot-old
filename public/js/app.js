'use strict';

require('../../db/db')({
  protocol: Jot.server.protocol,
  domain: Jot.server.domain,
  username: Jot.user.credentials.key,
  password: Jot.user.credentials.password,
  dbName: 'jot-' + Jot.user._id
});

const router = require('../../routers/path');

const RoutesHome = require('../../routes/client/home');
const RoutesNotes = require('../../routes/client/notes');
const RoutesAuth = require('../../routes/client/auth');

const Handlebars = require('handlebars/dist/handlebars.runtime');
const helpers = require('../../templates/helpers');

for (let key of Object.keys(Jot.templates)) {
  Handlebars.registerPartial(key, Handlebars.template(Jot.templates[key]));
}

for (let helper in helpers) {
  Handlebars.registerHelper(helper, helpers[helper]);
}

const routesHome = new RoutesHome(router, '/');

const routesAuth = new RoutesAuth(router, '/auth');

const routesNotes = new RoutesNotes(router, '/notes', {
  item: Jot.templates.note,
  itemadd: Jot.templates['note-add'],
  items: Jot.templates.notes
});

routesHome.registerRoutes();
routesAuth.registerRoutes();
routesNotes.registerRoutes();

router.activate();

