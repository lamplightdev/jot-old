if (window.operamini) {
  document.body.classList.add('operamini');
}

// cutting the ol' mustard like a pro
if ('visibilityState' in document) {
  document.querySelector('body').classList.remove('nojs');
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/serviceworker.js', {
      scope: '/',
    }).then(reg => {
      console.log('SW register success', reg);
    }, err => {
      console.log('SW register fail', err);
    });
  }

  if (!window.fetch) {
    require('whatwg-fetch');
  }

  fetch('/auth/user', {
    credentials: 'same-origin',
  }).then(response => {
    return response.json();
  }).then(json => {
    JotApp.user = json;

    if (JotApp.user !== false) {
      if (JotApp.user.credentials) {
        require('../../db/db')({
          protocol: JotApp.server.protocol,
          domain: JotApp.server.domain,
          username: JotApp.user.credentials.key,
          password: JotApp.user.credentials.password,
          dbName: 'jot-' + JotApp.user._id,
        });
        localStorage.setItem('jot-user', JSON.stringify(JotApp.user));
      } else {
        const localUser = localStorage.getItem('jot-user');

        if (localUser) {
          JotApp.user = JSON.parse(localUser);
          if (JotApp.user) {
            require('../../db/db')({
              protocol: JotApp.server.protocol,
              domain: JotApp.server.domain,
              username: JotApp.user.credentials.key,
              password: JotApp.user.credentials.password,
              dbName: 'jot-' + JotApp.user._id,
            });
          } else {
            require('../../db/db')({
              dbName: 'jot-local',
            });
          }
        } else {
          require('../../db/db')({
            dbName: 'jot-local',
          });
        }
      }
    } else {
      localStorage.setItem('jot-user', JSON.stringify(false));
      require('../../db/db')({
        dbName: 'jot-local',
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
    const NotificationManagerView = require('../../views/notification-manager');

    const Handlebars = require('handlebars/dist/handlebars.runtime');
    const helpers = require('../../templates/helpers');

    attachFastClick(document.body);

    for (const key of Object.keys(JotApp.templates)) {
      Handlebars.registerPartial(key, Handlebars.template(JotApp.templates[key]));
    }

    for (const helper in helpers) {
      if (helpers.hasOwnProperty(helper)) {
        Handlebars.registerHelper(helper, helpers[helper]);
      }
    }

    const containerMain = new ViewContainer('view', {
      home: JotApp.templates.home,
      group: JotApp.templates.group,
      groups: JotApp.templates.groups,
      jots: JotApp.templates.jots,
      loading: JotApp.templates.loading,
      loadinggroups: JotApp.templates.loadinggroups,
      import: JotApp.templates.import,
    }, {
      'group-list': JotApp.templates['group-list'],
      'jot-list': JotApp.templates['jot-list'],
    });

    const routesHome = new RoutesHome(router, '/', containerMain);
    const routesAuth = new RoutesAuth(router, '/auth', containerMain);
    const routesJot = new RoutesJot(router, '/jot', containerMain);
    const routesGroup = new RoutesGroup(router, '/group', containerMain);

    routesHome.registerRoutes();
    routesAuth.registerRoutes();
    routesJot.registerRoutes();
    routesGroup.registerRoutes();

    const containerHeader = new ViewContainer('header', {
      titlebar: JotApp.templates.titlebar,
    }, {
      'titlebar-title': JotApp.templates['titlebar-title'],
      'titlebar-tabs': JotApp.templates['titlebar-tabs'],
      'list-order': JotApp.templates['list-order'],
    });

    const titleBar = new TitleBarView(containerHeader);

    titleBar.render(false, {
      user: JotApp.user,
    });

    const containerNotifications = new ViewContainer('notifications', {
      notifications: JotApp.templates.notifications,
    }, {
      notification: JotApp.templates.notification,
    });

    const notificationManager = new NotificationManagerView(containerNotifications);

    notificationManager.render(true);

    router.activate();
  }).catch(ex => {
    console.log('something went wrong with auth/user', ex);
  });
}
