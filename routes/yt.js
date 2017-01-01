const express = require('express');
const querystring = require('querystring');
const request = require('request');
const url = require('url');

const router = express.Router();

router.get('/oath', function(req, res, next) {
    let qs = querystring.stringify({
        client_id: process.env.YT_CLIENT_ID,
        redirect_uri: process.env.BASE_URL + 'yt/oath2callback',
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
        access_type: 'offline',
        state: req.query.r || ''
    });
    res.redirect('https://accounts.google.com/o/oauth2/auth?' + qs);
});

router.get('/oath2callback', function(req, res, next) {
    let code = req.query.code;
    let state = req.query.state;

    request.post('https://accounts.google.com/o/oauth2/token').form({
        code: code,
        client_id: process.env.YT_CLIENT_ID,
        client_secret: process.env.YT_CLIENT_SECRET,
        redirect_uri: process.env.BASE_URL + 'yt/oath2callback',
        grant_type: 'authorization_code'
    }).on('response', function(response) {
        response.on('data', function(data) {
            req.app.ytAuth = JSON.parse(data);

            let expiration = new Date();
            expiration.setSeconds(expiration.getSeconds() + req.app.ytAuth.expires_in);
            req.models.yt_session.create({
                access_token: req.app.ytAuth.access_token,
                refresh_token: req.app.ytAuth.refresh_token,
                expires_at: expiration
            }, function(err) {
                if(err) throw err;
                req.app.ytAuth.expires_at = expiration;
                state = state || '';
                res.redirect('/' + state);
            });
        })
    });
});

module.exports = router;
