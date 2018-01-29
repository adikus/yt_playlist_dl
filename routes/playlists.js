const express = require('express');
const _ = require('lodash');
const async = require('async');

const Playlist = require('./../models/playlist');
const Video = require('./../models/video');
const PlaylistVideo = require('./../models/playlist_video');
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
    let ytPlasylists = await YtPlaylist.retrieve(req.session.ytAuth.access_token);
    await asyncPromise.eachLimit(ytPlasylists, 4, async function iteratee(item) {
        let playlist = await req.models.playlist.one({id: item.id});
        await Playlist.createOrUpdate(req, playlist, item);
    });
    res.redirect('/playlists');
}));

router.get('/:id', wrap(async function(req, res) {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }
    let videos = await playlist.getVideos();

    await Video.preload(req, videos, 'original_upload_id', 'originalUpload', 'upload');
    await Video.preload(req, videos, 'mp3_upload_id', 'mp3Upload', 'upload');

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
    let ytVideos = await YtPlaylist.getItems(req.params.id, req.session.ytAuth.access_token);
    await asyncPromise.eachLimit(ytVideos, 4, async function iteratee(item) {
        if (item.video) {
            let video = await req.models.video.oneAsync({id: item.video.id});
            video = await Video.createOrUpdate(req, video, item);
            let playlistVideo = await req.models.playlist_video.oneAsync({
                video_id: video.id,
                playlist_id: playlist.id
            });
            if(!playlistVideo.saveAsync) console.log('pv', playlistVideo);
            await PlaylistVideo.createOrUpdate(req, playlistVideo, playlist, video, item);
        }
    });
    let videos = await playlist.getVideos();
    await asyncPromise.eachLimit(videos, 4, async function(video) {
        if(!_(ytVideos).find({video: {id: video.id}})){
            let playlistVideo = await req.models.playlist_video.oneAsync({playlist_id: playlist.id, video_id: video.id});
            playlistVideo.status = 'removed';
            await playlistVideo.saveAsync();
            console.log(video.title + ' set as removed');
        }
    });

    res.redirect('/playlists/' + playlist.id);
}));

router.get('/:id/upload', async function(req, res) {
    let playlist = await Playlist.getFromDbOrApi(req, req.params.id);
    if(playlist.user_id !== req.user.id) {
        return res.send(401);
    }

    res.redirect('/playlists/' + playlist.id);

    let videos = await playlist.getVideos();
    await asyncPromise.eachLimit(videos, 4, async function iteratee(video) {
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

    await asyncPromise.eachLimit(videos, 4, async function iteratee(video) {
        if(!video.mp3_upload_id){
            await video.convertAndUploadToS3();
        }
    });

    console.log('-------------------------------------------');
    console.log('All finished-------------------------------');
    console.log('-------------------------------------------');
});

router.get('/:id/export', function(req, res) {
    Playlist.getFromDbOrApi(req, req.params.id, function(playlist) {
        req.models.video.find({playlist_id: playlist.id, status: 'public'}, {order: 'position'}, function(err, items) {
            if (err) throw err;

            items = _(items).filter((item) => item.S3Mp3Url()).value();

            res.render('export', {title: 'Export ' + playlist.title, playlist: playlist, items: items});
        });
    });
});

router.post('/:id/export', function(req, res) {
    Playlist.getFromDbOrApi(req, req.params.id, function(playlist) {
        req.models.video.find({playlist_id: playlist.id, status: 'public'}, {order: 'position'}, function(err, items) {
            if (err) throw err;

            exporter.exportAlbum(playlist, items, req.body.index, function(err, stream) {
                if(err) throw err;

                res.writeHead(200, {
                    'Content-Type': 'application/zip',
                    'Content-disposition': 'attachment;filename="' + playlist.metadata.album + '.zip"'
                });
                stream.pipe(res);

                console.log('Export done.');
            });
        });
    });
});

router.post('/:id/metadata', function(req, res) {
    Playlist.getFromDbOrApi(req, req.params.id, function(playlist) {
        playlist.metadata.album = req.body.album;
        playlist.markAsDirty('metadata');

        playlist.save(function(err) {
            if(err) throw err;

            if(req.files && req.files.image_file && req.files.image_file.data.length){
                playlist.uploadAlbumCover(req.files.image_file, function(err) {
                    if(err) throw err;

                    res.redirect('/playlists/' + playlist.id);
                });
            } else {
                res.redirect('/playlists/' + playlist.id);
            }
        });
    });
});

module.exports = router;
