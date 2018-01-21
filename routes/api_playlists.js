const express = require('express');
const _ = require('lodash');

const Playlist = require('./../models/playlist');
const wrap = require('./../lib/express-router-promise').wrap;

const router = express.Router();

router.get('/', wrap(async function(req, res) {
    let playlists = await req.models.playlist.find({user_id: req.user.id}, {order: '-created_at'});
    res.json({playlists: playlists});
}));

router.get('/:id', wrap(async (req, res) => {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }
    let videos = await playlist.getVideos();

    res.json({playlist: playlist, items: videos});
}));


module.exports = router;
