const express = require('express');
const _ = require('lodash');
const async = require('async');

const Playlist = require('./../models/playlist');
const Video = require('./../models/video');
const YtPlaylist = require('./../models/yt_playlist');
const exporter = require('./../services/exporter');

const router = express.Router();

router.get('/', function(req, res) {
    req.models.playlist.find({user_id: req.user.id}, {order: '-created_at'}, function(err, playlists) {
        if (err) throw err;
        res.render('playlists', {title: 'Your YT playlists', playlists: playlists, user: req.user});
    });
});

router.get('/refresh', function(req, res) {
    YtPlaylist.retrieve(req.session.ytAuth.access_token, function(items) {
        async.each(items, function iteratee(item, callback) {
            req.models.playlist.one({id: item.id}, function(err, playlist) {
                if (err) throw err;
                Playlist.createOrUpdate(req, playlist, item, callback);
            });
        }, function done() {
            res.redirect('/playlists');
        });
    });
});

router.get('/:id', function(req, res) {
    Playlist.getFromDbOrApi(req, req.params.id, function(playlist) {
        req.models.video.find({playlist_id: req.params.id}, {order: 'position'}, function(err, items) {
            if (err) throw err;

            if (items.length == 0){
                res.redirect('/playlists/' + req.params.id + '/refresh');
            } else {
                res.render('playlist', {title: playlist.title, playlist: playlist, items: items});
            }
        });
    });
});

router.get('/:id/refresh', function(req, res) {
    Playlist.getFromDbOrApi(req, req.params.id, function(playlist) {
        YtPlaylist.getItems(req.params.id, req.session.ytAuth.access_token, function(items) {
            async.each(items, function iteratee(item, callback) {
                if(item.video){
                    req.models.video.one({id: item.video.id}, function(err, video) {
                        if (err) throw err;
                        Video.createOrUpdate(req, playlist.id, video, item, callback);
                    });
                }
            }, function done() {
                req.models.video.find({playlist_id: playlist.id}, function(err, videos) {
                    if (err) throw err;

                    _(videos).each(function(video) {
                        if(!_(items).find({video: {id: video.id}})){
                            video.status = 'removed';
                            video.save(function() {
                                console.log(video.title + ' set as removed');
                            });
                        }
                    });

                    res.redirect('/playlists/' + playlist.id);
                });
            });
        });
    });
});

router.get('/:id/upload', function(req, res) {
    Playlist.getFromDbOrApi(req, req.params.id, function(playlist) {
        req.models.video.find({playlist_id: req.params.id}, {order: 'position'}, function(err, items) {
            if (err) throw err;
            async.eachLimit(items, 4, function iteratee(item, callback) {
                if(!item.metadata.s3_file || !item.metadata.s3_ext){
                    item.uploadToS3(callback);
                }else{
                    callback();
                }
            }, function done() {
                console.log('-------------------------------------------');
                console.log('All finished-------------------------------');
                console.log('-------------------------------------------');
            });

            res.redirect('/playlists/' + playlist.id);
        });
    });
});

router.get('/:id/convert', function(req, res) {
    Playlist.getFromDbOrApi(req, req.params.id, function(playlist) {
        req.models.video.find({playlist_id: req.params.id}, {order: 'position'}, function(err, items) {
            if (err) throw err;

            async.eachLimit(items, 4, function iteratee(item, callback) {
                if(!item.metadata.s3_mp3_file){
                    item.convertAndUploadToS3(function(err, item) {
                        if(err)console.log(err);
                        callback();
                    });
                }else{
                    callback();
                }
            }, function done() {
                console.log('-------------------------------------------');
                console.log('All finished-------------------------------');
                console.log('-------------------------------------------');
            });

            res.redirect('/playlists/' + playlist.id);
        });
    });
});

router.get('/:id/export', function(req, res) {
    Playlist.getFromDbOrApi(req, req.params.id, function(playlist) {
        req.models.video.find({playlist_id: playlist.id, status: 'public'}, {order: 'position'}, function(err, items) {
            if (err) throw err;

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
