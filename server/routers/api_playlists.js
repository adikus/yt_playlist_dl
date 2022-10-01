const express = require('express');
const _ = require('lodash');
const _fp = require('lodash/fp');

const Playlist = require('./../models/playlist');
const Video = require('./../models/video');
const wrap = require('./../lib/express-router-promise').wrap;

const router = express.Router();

router.get('/', wrap(async function(req, res) {
    let playlists = await req.models.playlist.findAsync({user_id: req.user.id}, {order: '-created_at'});
    let playlistIds = _(playlists).map('id').value();
    let videoCounts = await req.models.playlist_video.aggregate(
        ['playlist_id'],
        {playlist_id: playlistIds}
        ).groupBy('playlist_id').count('*').getAsync();
    for (const videoCount of videoCounts[0]) {
        if (videoCount['count_*'] > 1000) {
            let playlist = _(playlists).find({id: videoCount['playlist_id']})
            let playlistIndex = playlists.indexOf(playlist);
            if (playlistIndex > -1) {
                playlists.splice(playlistIndex, 1);
                let playlistVideos = await req.models.playlist_video.findAsync({playlist_id: playlist.id}, {order: 'position'});
                let positions = _(playlistVideos).map('position').value();
                for (let i = 0; i < videoCount['count_*']; i += 1000) {
                    let newPlaylist = Object.assign({}, playlist);
                    let from = positions[i];
                    let to = positions[i + 999] ? positions[i + 999] : positions[positions.length - 1];
                    newPlaylist.id = newPlaylist.id + '/' + from + '..' + to;
                    newPlaylist.title += ' Part ' + (i / 1000 + 1);
                    playlists.splice(playlistIndex + i / 1000, 0, newPlaylist);
                }
            }
        }
    }
    let playlistJson = _fp.map(_fp.pick(_.keys(req.models.playlist.properties)), playlists);
    res.json({playlists: playlistJson});
}));

async function prepareVideos(videos, req) {
    await Video.preload(req, videos, 'original_upload_id', 'originalUpload', 'upload');
    await Video.preload(req, videos, 'mp3_upload_id', 'mp3Upload', 'upload');

    _(videos).each((video) => {
        video.playlistVideo = _(video.playlistVideo).pick(_.keys(req.models.playlist_video.properties));
        video.originalUpload && (video.originalUpload.url = video.originalUpload.S3Url());
        video.mp3Upload && (video.mp3Upload.url = video.mp3Upload.S3Url());
        let uploadColumns = _.keys(req.models.upload.properties);
        uploadColumns.push('url');
        video.originalUpload = _(video.originalUpload).pick(uploadColumns);
        video.mp3Upload = _(video.mp3Upload).pick(uploadColumns);
    });
    let videoColumns = _.keys(req.models.video.properties);
    videoColumns.push('originalUpload', 'mp3Upload', 'playlistVideo');
    return _fp.map(_fp.pick(videoColumns), videos);
}

router.get('/:id', wrap(async (req, res) => {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }
    let videos = await playlist.getVideos();
    let videosJson = await prepareVideos(videos, req);

    let playlistJson = _(playlist).pick(_.keys(req.models.playlist.properties));
    res.json({playlist: playlistJson, items:videosJson});
}));

router.get('/:id/:range', wrap(async (req, res) => {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }
    let [from, to] = req.params.range.split('..');
    let videos = await playlist.getVideos({position: [from, to]});
    let videosJson = await prepareVideos(videos, req);

    let playlistJson = _(playlist).pick(_.keys(req.models.playlist.properties));
    res.json({playlist: playlistJson, items:videosJson});
}));


module.exports = router;
