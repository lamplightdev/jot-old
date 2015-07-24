'use strict';

require('../../db/db')({
  protocol: JotApp.server.protocol,
  domain: JotApp.server.domain,
  username: JotApp.user.credentials.key,
  password: JotApp.user.credentials.password,
  dbName: 'jot-' + JotApp.user._id
});

const router = require('../../routers/path');

const RoutesHome = require('../../routes/client/home');
const RoutesNotes = require('../../routes/client/notes');
const RoutesAuth = require('../../routes/client/auth');

const TitleBarView = require('../../views/titlebar');

const Handlebars = require('handlebars/dist/handlebars.runtime');
const helpers = require('../../templates/helpers');

for (let key of Object.keys(JotApp.templates)) {
  Handlebars.registerPartial(key, Handlebars.template(JotApp.templates[key]));
}

for (let helper in helpers) {
  Handlebars.registerHelper(helper, helpers[helper]);
}

const routesHome = new RoutesHome(router, '/');

const routesAuth = new RoutesAuth(router, '/auth');

const routesNotes = new RoutesNotes(router, '/notes', {
  item: JotApp.templates.note,
  itemadd: JotApp.templates['note-add'],
  items: JotApp.templates.notes
});

routesHome.registerRoutes();
routesAuth.registerRoutes();
routesNotes.registerRoutes();

const titleBar = new TitleBarView(JotApp.templates.titlebar, {
  'titlebar-title': JotApp.templates['titlebar-title']
}, document.getElementById('header'));

titleBar.render(true);

router.activate();

