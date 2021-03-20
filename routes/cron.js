const express = require('express');
const _ = require('lodash');
const util = require('util');

const ytOauth = require('./../services/yt_oauth');
const wrap = require('./../lib/express-router-promise').wrap;

const Playlist = require('./../models/playlist');

const router = express.Router();

router.get('/refresh-all', wrap(async function(req, res) {
    let users = await req.models.user.allAsync();

    for(let user of users) {
        console.log('Refreshing playlists for', user.username);
        req.user = user;
        req.session.ytAuth = null;
        await util.promisify(ytOauth.requestCheck).call(ytOauth, req, res);
        if (req.session.ytAuth === null) continue;
        await Playlist.refresh(req);
        let playlists = await req.models.playlist.findAsync({user_id: req.user.id});
        for(let playlist of playlists) {
            console.log('Refreshing', playlist.title);
            await playlist.refresh(req);
        }
    }

    res.json({status: 'ok'});
}));

module.exports = router;