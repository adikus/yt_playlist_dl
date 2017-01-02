const express = require('express');

const Playlist = require('./../models/playlist');
const exporter = require('./../services/exporter');

const router = express.Router();

router.get('/', function(req, res) {
    req.models.playlist.find({user_id: req.user.id}, {order: '-created_at'}, function(err, playlists) {
        if (err) throw err;

        res.json({playlists: playlists});
    });
});

router.get('/:id', function(req, res) {
    Playlist.getFromDbOrApi(req, req.params.id, function(playlist) {
        req.models.video.find({playlist_id: req.params.id}, {order: 'position'}, function(err, items) {
            if (err) throw err;

            res.json({playlist: playlist, items: items});
        });
    });
});


module.exports = router;
