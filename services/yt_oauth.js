const request = require('request');
const _ = require('lodash');

module.exports = {
    checkAuthExpiration: function (req, res, next) {
        let self = this;

        if (req.session.ytAuth) {
            let expiresAt = new Date(req.session.ytAuth.expires_at);
            let now = new Date();
            if (now.getTime() < expiresAt.getTime()) {
                return next();
            } else if (req.session.ytAuth.refresh_token) {
                return self.getToken(req, res, next, {refresh_token: req.session.ytAuth.refresh_token, grant_type: 'refresh_token'});
            }
        }
        return res.redirect('/yt/oauth?r=' + req.url.substr(1));
    },

    requestCheck: function (req, res, next) {
        let self = this;

        if (!req.session.ytAuth) {
            req.models.yt_session.one({user_id: req.user.id}, {order: '-expires_at'}, function (err, session) {
                req.session.ytAuth = session;
                self.checkAuthExpiration(req, res, next);
            });
        }
        else {
            this.checkAuthExpiration(req, res, next);
        }
    },

    getToken: function (req, res, callback, params) {
        console.log('Retrieving YT token for user', req.user.id);

        let ytParams = _(params).merge({
            client_id: process.env.YT_CLIENT_ID,
            client_secret: process.env.YT_CLIENT_SECRET,
            redirect_uri: process.env.BASE_URL + 'yt/oauth2callback'
        }).value();

        request.post('https://accounts.google.com/o/oauth2/token').form(ytParams).on('response', function (response) {
            response.on('data', function (data) {
                req.session.ytAuth = JSON.parse(data);

                let expiration = new Date();
                let refreshToken = req.session.ytAuth.refresh_token || params.refresh_token;
                expiration.setSeconds(expiration.getSeconds() + req.session.ytAuth.expires_in);
                req.models.yt_session.create({
                    access_token: req.session.ytAuth.access_token,
                    refresh_token: refreshToken,
                    user_id: req.user.id,
                    expires_at: expiration
                }, function (err) {
                    if (err) throw err;
                    req.session.ytAuth.expires_at = expiration;
                    req.session.ytAuth.refresh_token = refreshToken;

                    callback();
                });
            })
        });
    }
};
