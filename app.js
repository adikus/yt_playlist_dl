const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const orm = require('orm');
const S3Bucket = require('./services/s3_bucket');
const fileUpload = require('express-fileupload');

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

app.s3Bucket = new S3Bucket('yt-playlist');

app.use(orm.express(process.env.DATABASE_URL, {
    define: function (db, models, next) {
        require('./services/db').define(db, models, app);
        next();
    }
}));

app.use('/yt', ytRouter);

function checkAuthExpiration(req, res, next) {
    if(req.app.ytAuth){
        let expiresAt = req.app.ytAuth.expires_at;
        let now = new Date();
        if (now.getTime() < expiresAt.getTime()){
            return next();
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
