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
const LocalStrategy = require('passport-local').Strategy;

const index = require('./routes/index');
const playlists = require('./routes/playlists');
const videos = require('./routes/videos');
const ytRouter = require('./routes/yt');

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

app.use('/yt', ytRouter);

function checkAuthExpiration(req, res, next) {
    if(req.app.ytAuth){
        let expiresAt = req.app.ytAuth.expires_at;
        let now = new Date();
        //if(false){
        if (now.getTime() < expiresAt.getTime()){
            return next();
        } else if(req.app.ytAuth.refresh_token){
            let refresh_token = req.app.ytAuth.refresh_token;
            return request.post('https://accounts.google.com/o/oauth2/token').form({
                client_id: process.env.YT_CLIENT_ID,
                client_secret: process.env.YT_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            }).on('response', function(response) {
                response.on('data', function(data) {
                    req.app.ytAuth = JSON.parse(data);

                    let expiration = new Date();
                    expiration.setSeconds(expiration.getSeconds() + req.app.ytAuth.expires_in);
                    req.models.yt_session.create({
                        access_token: req.app.ytAuth.access_token,
                        refresh_token: req.app.ytAuth.refresh_token || refresh_token,
                        expires_at: expiration
                    }, function(err) {
                        if(err) throw err;
                        req.app.ytAuth.expires_at = expiration;
                        next();
                    });
                })
            });
        }
    }
    return res.redirect('/yt/oath?r=' + req.url.substr(1));
}

// Check YT credentials
app.use(function(req, res, next) {
    if(!req.app.ytAuth){
        req.models.yt_session.one({}, {order: '-expires_at'}, function(err, session) {
            req.app.ytAuth = session;
            checkAuthExpiration(req, res, next);
        });
    }
    else {
        checkAuthExpiration(req, res, next);
    }
});

app.use('/', index);
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
