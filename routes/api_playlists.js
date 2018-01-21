const express = require('express');
const _ = require('lodash');

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
    let playlistVideos = await req.models.playlist_video.findAsync({playlist_id: req.params.id, user_id: req.user.id}, {order: 'position'});
    let videoIds = _(playlistVideos).map(playlistVideo => playlistVideo.video_id).value();
    let videos = await req.models.video.findAsync({id: videoIds});
    videos = _(videos).sortBy((video) => {
        let playlistVideo = _(playlistVideos).find({video_id: video.id});
        video.position = playlistVideo.position;
        return video.position;
    }).value();
    res.json({playlist: playlist, items: videos});
});


module.exports = router;
