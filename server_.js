'use strict';

require("babel-register");

var express = require('express');
var expressState = require('express-state');
var exphbs = require('express-handlebars');
var path = require('path');
var session = require('express-session');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression');

var passport = require('passport');
var auth = require('./utility/auth');

var redis = require('redis');
var RedisStore = require('connect-redis')(session);

var RoutesHome = require('./routes/server/home');
var RoutesJot = require('./routes/server/jot');
var RoutesGroup = require('./routes/server/group');
var RoutesAuth = require('./routes/server/auth');

var app = express();
app.use(compression());

var env = process.env.NODE_ENV || 'development';

if (env === 'production') {
  app.use(function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    return next();
  });
}

expressState.extend(app);
app.set('state namespace', 'JotApp');

app.set('views', path.join(__dirname, 'templates'));
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  layoutsDir: './templates/layouts',
  partialsDir: './templates/partials',
  helpers: require('./templates/helpers')
}));
app.set('view engine', 'handlebars');

app.use(function (req, res, next) {
  var ExpHbs = exphbs.create();
  ExpHbs.getTemplates(app.get('views') + '/partials', {
    precompiled: true
  }).then(function (templates) {
    var tmpls = {};
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(templates)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        var template = undefined;eval('template = ' + templates[key]);
        tmpls[key.replace('.handlebars', '')] = template;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
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

var redisClient = redis.createClient(process.env.JOT_REDIS_PORT, process.env.JOT_REDIS_HOST, {});
redisClient.select(process.env.JOT_REDIS_DB, function () {});
redisClient.on('error', function (err) {
  console.log('Redis error: ' + err);
});

app.use(session({
  store: new RedisStore({
    client: redisClient,
    pass: process.env.JOT_REDIS_PASSWORD
  }),
  secret: 'kl988sd87scoijsanc*^*&%g',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1209600 * 1000 }
}));

// two weeks
app.use(passport.initialize());
app.use(passport.session());
auth.serialization();
auth.Google();

app.use(function (req, res, next) {
  // app.expose(req.user, 'user');
  app.expose({
    protocol: 'https', // process.env.JOT_CLOUDANT_HOST_PROTOCOL,
    domain: 'lamplightdev.cloudant.com' }, // process.env.JOT_CLOUDANT_HOST_NAME,
  'server');

  if (req.user) {
    var db = require('./db/db');
    db({
      protocol: 'https', // process.env.JOT_CLOUDANT_HOST_PROTOCOL,
      domain: 'lamplightdev.cloudant.com', // process.env.JOT_CLOUDANT_HOST_NAME,
      username: req.user.credentials.key,
      password: req.user.credentials.password,
      dbName: 'jot-' + req.user._id
    });
  }

  next();
});

app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
});

var routesHome = new RoutesHome(require('express').Router());
app.use('/', routesHome.registerRoutes());
var routesJot = new RoutesJot(require('express').Router());
app.use('/jot', routesJot.registerRoutes());
var routesGroup = new RoutesGroup(require('express').Router());
app.use('/group', routesGroup.registerRoutes());
var routesAuth = new RoutesAuth(require('express').Router());
app.use('/auth', routesAuth.registerRoutes());

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    console.log(err);
    var status = err.status || 500;
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
app.use(function (err, req, res, next) {
  var status = err.status || 500;
  res.status(status);
  res.render('app', {
    content: status,
    message: err.message,
    error: {}
  });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + server.address().address + ':' + server.address().port);
});
