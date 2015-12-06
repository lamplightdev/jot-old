const express = require('express');
const expressState = require('express-state');
const exphbs = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');

const passport = require('passport');
const auth = require('./utility/auth');

const redis = require('redis');
const RedisStore = require('connect-redis')(session);

const RoutesHome = require('./routes/server/home');
const RoutesJot = require('./routes/server/jot');
const RoutesGroup = require('./routes/server/group');
const RoutesAuth = require('./routes/server/auth');

const app = express();
app.use(compression());

const env = process.env.NODE_ENV || 'development';

if (env === 'production') {
  app.use((req, res, next) => {
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
  helpers: require('./templates/helpers'),
}));
app.set('view engine', 'handlebars');

app.use((req, res, next) => {
  const ExpHbs = exphbs.create();
  ExpHbs.getTemplates(app.get('views') + '/partials', {
    precompiled: true,
  }).then(templates => {
    const tmpls = {};
    for (const key of Object.keys(templates)) {
      let template; eval('template = ' + templates[key]);
      tmpls[key.replace('.handlebars', '')] = template;
    }

    app.expose(tmpls, 'templates', {
      cache: true,
    });

    next();
  }, next);
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const redisClient = redis.createClient(
  process.env.JOT_REDIS_PORT,
  process.env.JOT_REDIS_HOST,
  {}
);
redisClient.select(process.env.JOT_REDIS_DB, () => {});
redisClient.on('error', (err) => {
  console.log('Redis error: ' + err);
});

app.use(session({
  store: new RedisStore({
    client: redisClient,
    pass: process.env.JOT_REDIS_PASSWORD,
  }),
  secret: 'kl988sd87scoijsanc*^*&%g',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1209600 * 1000, // two weeks
  },
}));

app.use(passport.initialize());
app.use(passport.session());
auth.serialization();
auth.Google();

app.use((req, res, next) => {
  // app.expose(req.user, 'user');
  app.expose({
    protocol: 'https', // process.env.JOT_CLOUDANT_HOST_PROTOCOL,
    domain: 'lamplightdev.cloudant.com', // process.env.JOT_CLOUDANT_HOST_NAME,
  }, 'server');

  if (req.user) {
    const db = require('./db/db');
    db({
      protocol: 'https', // process.env.JOT_CLOUDANT_HOST_PROTOCOL,
      domain: 'lamplightdev.cloudant.com', // process.env.JOT_CLOUDANT_HOST_NAME,
      username: req.user.credentials.key,
      password: req.user.credentials.password,
      dbName: 'jot-' + req.user._id,
    });
  }

  next();
});

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

const routesHome = new RoutesHome(require('express').Router());
app.use('/', routesHome.registerRoutes());
const routesJot = new RoutesJot(require('express').Router());
app.use('/jot', routesJot.registerRoutes());
const routesGroup = new RoutesGroup(require('express').Router());
app.use('/group', routesGroup.registerRoutes());
const routesAuth = new RoutesAuth(require('express').Router());
app.use('/auth', routesAuth.registerRoutes());

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    console.log(err);
    const status = err.status || 500;
    res.status(status);
    res.render('app', {
      content: status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status);
  res.render('app', {
    content: status,
    message: err.message,
    error: {},
  });
});

app.set('port', process.env.PORT || 3000);

const server = app.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + server.address().address + ':' + server.address().port);
});

