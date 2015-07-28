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
const RoutesAuth = require('../../routes/client/auth');
const RoutesJot = require('../../routes/client/jot');
const RoutesGroup = require('../../routes/client/group');

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

const routesJot = new RoutesJot(router, '/jot', {
  item: JotApp.templates.jot,
  itemadd: JotApp.templates['note-add'],
  items: JotApp.templates.jots
});

const routesGroup = new RoutesGroup(router, '/group', {
  item: JotApp.templates.group,
  itemadd: JotApp.templates['note-add'],
  items: JotApp.templates.groups
});

routesHome.registerRoutes();
routesAuth.registerRoutes();
routesJot.registerRoutes();
routesGroup.registerRoutes();

const titleBar = new TitleBarView(JotApp.templates.titlebar, {
  'titlebar-title': JotApp.templates['titlebar-title']
}, document.getElementById('header'));

titleBar.render(true);

router.activate();

