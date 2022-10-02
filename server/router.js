const express = require("express");
const router = express.Router();
const cors = require('cors');

const { passwordCheck, apiKeyCheck } = require('./passport');
const { ytCheck } = require('./services/yt_oauth')
const assetsRouter = require("./routers/dev-assets-router");
const manifest = require('./manifest');

router.use(assetsRouter);

router.use((req, res, next) => { res.locals.manifest = manifest; next(); });

// Routes that don't require authentication
router.use('/', require('./routers/index'));

// Routes that require Bearer Token
router.use('/cron', apiKeyCheck, require('./routers/cron'));

// Routes that require authentication but don't require YT account
router.use('/yt', passwordCheck, require('./routers/yt'));

// Routes that require both authentication and YT account
router.use('/playlists', passwordCheck, ytCheck, require('./routers/playlists'));
router.use('/videos', passwordCheck, ytCheck, require('./routers/videos'));
router.use('/playlist-videos', passwordCheck, ytCheck, require('./routers/playlist_videos'));

// Routes that require API key authentication
router.use('/api/playlists', cors(), apiKeyCheck, require('./routers/api_playlists'));
router.use('/api/videos', cors(), apiKeyCheck, require('./routers/api_videos'));

// catch 404 and forward to error handler
router.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
router.use(function(err, req, res, _next) {
    // set locals, only providing error in development
    res.locals.messages = { error: err.message };
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = router;
