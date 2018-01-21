const express = require('express');

const Playlist = require('./../models/playlist');

const router = express.Router();

router.get('/', function(req, res) {
    req.models.playlist.find({user_id: req.user.id}, {order: '-created_at'}, function(err, playlists) {
        if (err) throw err;

        res.json({playlists: playlists});
    });
});

router.get('/:id', async (req, res) => {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    let videos = await req.models.video.findAsync({playlist_id: req.params.id}, {order: 'position'});
    res.json({playlist: playlist, items: videos});
});


module.exports = router;
