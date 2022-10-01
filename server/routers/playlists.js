const express = require('express');
const _ = require('lodash');

const Playlist = require('./../models/playlist');
const Video = require('./../models/video');
const YtPlaylist = require('./../models/yt_playlist');
const exporter = require('./../services/exporter');
const wrap = require('./../lib/express-router-promise').wrap;
const asyncPromise = require('./../lib/async-promise');

const router = express.Router();

router.get('/', wrap(async function(req, res) {
    let playlists = await req.models.playlist.findAsync({user_id: req.user.id}, {order: '-created_at'});
    res.render('playlists', {title: 'Your YT playlists', playlists: playlists, user: req.user});
}));

router.get('/refresh', wrap(async function(req, res) {
    await Playlist.refresh(req);
    res.redirect('/playlists');
}));

router.get('/:id', wrap(async function(req, res) {
    // TODO: extract common stuff
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }
    let videos = await playlist.getVideos();

    await Video.preload(req, videos, 'original_upload_id', 'originalUpload', 'upload');
    await Video.preload(req, videos, 'mp3_upload_id', 'mp3Upload', 'upload');
    await Video.preloadCustomUploads(req, videos);

    if (videos.length === 0){
        res.redirect('/playlists/' + req.params.id + '/refresh');
    } else {
        res.render('playlist', {title: playlist.title, playlist: playlist, items: videos});
    }
}));

router.get('/:id/refresh', wrap(async function(req, res) {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }
    await playlist.refresh(req);

    res.redirect('/playlists/' + playlist.id);
}));

router.get('/:id/upload', async function(req, res) {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }

    res.redirect('/playlists/' + playlist.id);

    let videos = await playlist.getVideos();
    await asyncPromise.eachLimit(videos, 50, async function iteratee(video) {
        let upload = await video.getUpload();
        if(!upload) {
            await video.uploadToS3();
        }
    });

    console.log('-------------------------------------------');
    console.log('All finished-------------------------------');
    console.log('-------------------------------------------');
});

router.get('/:id/convert', async function(req, res) {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }

    res.redirect('/playlists/' + playlist.id);

    let videos = await playlist.getVideos();
    await Video.preload(req, videos, 'mp3_upload_id', 'mp3Upload', 'upload');

    await asyncPromise.eachLimit(videos, 200, async function iteratee(video) {
        if(!video.mp3Upload){
            try {
                await video.convertAndUploadToS3();
            } catch (err) {
                console.error(err);
            }
        }
    });

    console.log('-------------------------------------------');
    console.log('All finished-------------------------------');
    console.log('-------------------------------------------');
});

router.get('/:id/export', wrap(async function(req, res) {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }

    let videos = await playlist.getVideos();
    await Video.preload(req, videos, 'mp3_upload_id', 'mp3Upload', 'upload');
    videos = _(videos).filter((video) => video.mp3Upload && video.mp3Upload.file).value();
    res.render('export', {title: 'Export ' + playlist.title, playlist: playlist, items: videos});
}));

router.post('/:id/export', wrap(async function(req, res) {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }

    let videos = await playlist.getVideos();
    let stream = await exporter.exportAlbum(playlist, videos, req.body.index);
    res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-disposition': 'attachment;filename="' + playlist.album_name + '.zip"'
    });
    stream.pipe(res).on('finish', function () {
        stream.cleanUp();
    });

    console.log('Export done.');
}));

router.post('/:id/metadata', wrap(async function(req, res) {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }

    playlist.autoupdate = req.body.autoupdate === 'on';
    playlist.album_name = req.body.album;
    await playlist.saveAsync();

    if(req.files && req.files.image_file && req.files.image_file.data.length){
        await playlist.uploadAlbumCover(req.files.image_file);
    }
    res.redirect('/playlists/' + playlist.id);
}));

module.exports = router;
