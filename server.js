'use strict';

const express = require('express');
const expressState = require('express-state');
const exphbs  = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const passport = require('passport');
const auth = require('./utility/auth');

const RoutesHome = require('./routes/server/home');
const RoutesNotes = require('./routes/server/notes');
const RoutesAuth = require('./routes/server/auth');

const app = express();
expressState.extend(app);
app.set('state namespace', 'Jot');

app.set('views', path.join(__dirname, 'templates'));
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  layoutsDir: './templates/layouts',
  partialsDir: './templates/partials',
  helpers: require('./templates/helpers')
}));
app.set('view engine', 'handlebars');

app.use(function(req, res, next) {
  const ExpHbs = exphbs.create();
  ExpHbs.getTemplates(app.get('views') + '/partials', {
    precompiled: true
  }).then(templates => {
    const tmpls = {};
    for (let key of Object.keys(templates)) {
      let template; eval('template = ' + templates[key]);
      tmpls[key.replace('.handlebars', '')] = template;
    }

    app.expose(tmpls, 'templates', {
      cache: true
    });

    next();
  }, next);
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'kljsd87scoijsanc*^*&%g',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1209600 //two weeks
  }
}));

app.use(passport.initialize());
app.use(passport.session());
auth.serialization();
auth.Google();

app.use((req, res, next) => {
  app.expose(req.user, 'user');
  app.expose({
    protocol: 'https', //process.env.EVENTDASH_CLOUDANT_HOST_PROTOCOL,
    domain: 'lamplightdev.cloudant.com' //process.env.EVENTDASH_CLOUDANT_HOST_NAME,
  }, 'server');

  if (req.user) {
    const db = require('./db/db');
    db({
      protocol: 'https', //process.env.EVENTDASH_CLOUDANT_HOST_PROTOCOL,
      domain: 'lamplightdev.cloudant.com', //process.env.EVENTDASH_CLOUDANT_HOST_NAME,
      username: req.user.credentials.key,
      password: req.user.credentials.password,
      dbName: 'jot-google-' + req.user._id
    });
  }

  next();
});

const routesHome = new RoutesHome(require('express').Router());
app.use('/', routesHome.registerRoutes());
const routesNotes = new RoutesNotes(require('express').Router());
app.use('/notes', routesNotes.registerRoutes());
const routesAuth = new RoutesAuth(require('express').Router());
app.use('/auth', routesAuth.registerRoutes());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log(err);
    const status = err.status || 500;
    res.status(status);
    res.render('app', {
      content: status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  const status = err.status || 500;
  res.status(status);
  res.render('app', {
    content: status,
    message: err.message,
    error: {}
  });
});

app.set('port', process.env.PORT || 3000);

const server = app.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + server.address().address + ':' + server.address().port);
});

