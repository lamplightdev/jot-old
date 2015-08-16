'use strict';

if (JotApp.user) {
  require('../../db/db')({
    protocol: JotApp.server.protocol,
    domain: JotApp.server.domain,
    username: JotApp.user.credentials.key,
    password: JotApp.user.credentials.password,
    dbName: 'jot-' + JotApp.user._id
  });
} else {
  require('../../db/db')({
    dbName: 'jot-local'
  });
}

const attachFastClick = require('fastclick');

const ViewContainer = require('../../views/view-container');

const router = require('../../routers/path');

const RoutesHome = require('../../routes/client/home');
const RoutesAuth = require('../../routes/client/auth');
const RoutesJot = require('../../routes/client/jot');
const RoutesGroup = require('../../routes/client/group');

const TitleBarView = require('../../views/titlebar');

const Handlebars = require('handlebars/dist/handlebars.runtime');
const helpers = require('../../templates/helpers');

attachFastClick(document.body);

for (let key of Object.keys(JotApp.templates)) {
  Handlebars.registerPartial(key, Handlebars.template(JotApp.templates[key]));
}

for (let helper in helpers) {
  Handlebars.registerHelper(helper, helpers[helper]);
}

const containerMain = new ViewContainer('view', {
  home: JotApp.templates.home,
  group: JotApp.templates.group,
  groups: JotApp.templates.groups,
  jots: JotApp.templates.jots,
  loading: JotApp.templates.loading
}, {
  'group-list': JotApp.templates['group-list'],
  'jot-list': JotApp.templates['jot-list']
});

const routesHome = new RoutesHome(router, '/', containerMain);
const routesAuth = new RoutesAuth(router, '/auth');
const routesJot = new RoutesJot(router, '/jot', containerMain);
const routesGroup = new RoutesGroup(router, '/group', containerMain);

routesHome.registerRoutes();
routesAuth.registerRoutes();
routesJot.registerRoutes();
routesGroup.registerRoutes();

const containerHeader = new ViewContainer('header', {
  titlebar: JotApp.templates.titlebar
}, {
  'titlebar-title': JotApp.templates['titlebar-title'],
  'titlebar-tabs': JotApp.templates['titlebar-tabs'],
  'list-order': JotApp.templates['list-order']
});

const titleBar = new TitleBarView(containerHeader);

titleBar.render(true);
router.activate();

