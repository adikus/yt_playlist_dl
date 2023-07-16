const request = require('request-promise');
const logger = require("../logger");

async function ytCheck(req, res, next) {
    if (!req.session.ytAuth) {
        req.session.ytAuth = await req.models.yt_session.oneAsync({user_id: req.user.id}, {order: '-expires_at'});
    }

    await checkAuthExpiration(req, res, next);
}

async function getToken(req, res, params) {
    logger.log('Retrieving YT token for user', req.user.id);

    const options = {
        method: 'POST',
        uri: 'https://accounts.google.com/o/oauth2/token',
        body: {
            ...params,
            client_id: process.env.YT_CLIENT_ID,
            client_secret: process.env.YT_CLIENT_SECRET,
            redirect_uri: process.env.BASE_URL + 'yt/oauth2callback'
        },
        json: true
    }

    req.session.ytAuth = await request(options);

    let expiration = new Date();
    let refreshToken = req.session.ytAuth.refresh_token || params.refresh_token;
    expiration.setSeconds(expiration.getSeconds() + req.session.ytAuth.expires_in);

    req.models.yt_session.createAsync({
        access_token: req.session.ytAuth.access_token,
        refresh_token: refreshToken,
        user_id: req.user.id,
        expires_at: expiration
    });

    req.session.ytAuth.expires_at = expiration;
    req.session.ytAuth.refresh_token = refreshToken;
}

async function checkAuthExpiration(req, res, next) {
    if (req.session.ytAuth) {
        let expiresAt = new Date(req.session.ytAuth.expires_at);
        let now = new Date();
        if (now.getTime() < expiresAt.getTime()) {
            return next();
        } else if (req.session.ytAuth.refresh_token) {
            await getToken(req, res, {refresh_token: req.session.ytAuth.refresh_token, grant_type: 'refresh_token'});
            return next();
        }
    }
    if (req.originalUrl.indexOf('/cron/') === -1) {
        return res.redirect('/yt/oauth?r=' + req.url.substr(1));
    } else {
        return next();
    }
}

module.exports = { ytCheck, getToken, checkAuthExpiration };
