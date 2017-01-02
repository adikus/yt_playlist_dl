const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const orm = require('orm');
const S3Bucket = require('./services/s3_bucket');
const fileUpload = require('express-fileupload');
const request = require('request');
const passport = require('passport');
const session = require('express-session');
const flash = require('express-flash');
const LocalStrategy = require('passport-local').Strategy;

const index = require('./routes/index');
const playlists = require('./routes/playlists');
const videos = require('./routes/videos');
const ytRouter = require('./routes/yt');
const ytOauth = require('./services/yt_oauth');

let app = express();
app.set('env', 'development');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(session({ secret: 'verysecretsessionkey', saveUninitialized: false, resave: false, rolling: true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.s3Bucket = new S3Bucket('yt-playlist');

app.use(orm.express(process.env.DATABASE_URL, {
    define: function (db, models, next) {
        app.models = models;
        require('./services/db').define(db, models, app);
        next();
    }
}));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    app.models.user.get(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        app.models.user.one({ username: username }, function(err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            user.validatePassword(password, function(match) {
                if (!match) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            });
        });
    }
));

// Routes that don't require authentication
app.use('/', index);

app.use(function(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else {
        req.flash('error', 'Please sign in');
        res.redirect('/');
    }
});

// Routes that require authentication but don't require YT account
app.use('/yt', ytRouter);

// Check YT credentials
app.use((req, res, next) => ytOauth.requestCheck(req, res, next));

// Routes that require both authentication and YT account
app.use('/playlists', playlists);
app.use('/videos', videos);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
