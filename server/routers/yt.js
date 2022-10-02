const express = require('express');
const url = require('url');
const querystring = require('querystring');

const ytOauth = require('./../services/yt_oauth');

const router = express.Router();

router.get('/oauth', function(req, res, next) {
    let qs = querystring.stringify({
        client_id: process.env.YT_CLIENT_ID,
        redirect_uri: process.env.BASE_URL + 'yt/oauth2callback',
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
        access_type: 'offline',
        approval_prompt: 'force',
        state: req.query.r || ''
    });
    res.redirect('https://accounts.google.com/o/oauth2/auth?' + qs);
});

router.get('/oauth2callback', function(req, res, next) {
    let code = req.query.code;
    let state = req.query.state || '';

    ytOauth.getToken(req, res, () => res.redirect('/' + state), {code: code, grant_type: 'authorization_code'});
});

module.exports = router;
