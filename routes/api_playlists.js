const express = require('express');
const _ = require('lodash');
const _fp = require('lodash/fp');

const Playlist = require('./../models/playlist');
const Video = require('./../models/video');
const wrap = require('./../lib/express-router-promise').wrap;

const router = express.Router();

router.get('/', wrap(async function(req, res) {
    let playlists = await req.models.playlist.findAsync({user_id: req.user.id}, {order: '-created_at'});
    let playlistJson = _fp.map(_fp.pick(_.keys(req.models.playlist.properties)), playlists);
    res.json({playlists: playlistJson});
}));

router.get('/:id', wrap(async (req, res) => {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }
    let videos = await playlist.getVideos();
    await Video.preload(req, videos, 'original_upload_id', 'originalUpload', 'upload');
    await Video.preload(req, videos, 'mp3_upload_id', 'mp3Upload', 'upload');

    let playlistJson = _(playlist).pick(_.keys(req.models.playlist.properties));
    _(videos).each((video) => {
        video.playlistVideo = _(video.playlistVideo).pick(_.keys(req.models.playlist_video.properties));
        video.originalUpload.url = video.originalUpload && video.originalUpload.S3Url();
        video.mp3Upload.url = video.mp3Upload && video.mp3Upload.S3Url();
        let uploadColumns = _.keys(req.models.upload.properties);
        uploadColumns.push('url');
        video.originalUpload = _(video.originalUpload).pick(uploadColumns);
        video.mp3Upload = _(video.mp3Upload).pick(uploadColumns);
    });
    let videoColumns = _.keys(req.models.video.properties);
    videoColumns.push('originalUpload', 'mp3Upload', 'playlistVideo');
    let videosJson = _fp.map(_fp.pick(videoColumns), videos);

    res.json({playlist: playlistJson, items:videosJson});
}));


module.exports = router;
