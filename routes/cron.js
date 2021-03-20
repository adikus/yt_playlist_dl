const express = require('express');
const _ = require('lodash');
const util = require('util');

const ytOauth = require('./../services/yt_oauth');
const wrap = require('./../lib/express-router-promise').wrap;
const asyncPromise = require('./../lib/async-promise');

const Playlist = require('./../models/playlist');
const Video = require('./../models/video');

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

router.get('/download-all', wrap(async function(req, res) {
    let users = await req.models.user.allAsync();

    for(let user of users) {
        console.log('Downloading playlists for', user.username);
        req.user = user;
        let playlists = await req.models.playlist.findAsync({user_id: req.user.id, autoupdate: true});
        for(let playlist of playlists) {
            console.log('Downloading', playlist.title);
            let videos = await playlist.getVideos();
            await Video.preload(req, videos, 'original_upload_id', 'originalUpload', 'upload');
            await asyncPromise.eachLimit(videos, 50, async function iteratee(video) {
                if(!video.originalUpload) {
                    await video.uploadToS3();
                }
            });
        }
    }

    res.json({status: 'ok'});
}));

router.get('/convert-all', wrap(async function(req, res) {
    let users = await req.models.user.allAsync();

    for(let user of users) {
        console.log('Converting playlists for', user.username);
        req.user = user;
        let playlists = await req.models.playlist.findAsync({user_id: req.user.id, autoupdate: true});
        for(let playlist of playlists) {
            console.log('Converting', playlist.title);
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

            console.log('Done');
        }
    }

    res.json({status: 'ok'});
}));

module.exports = router;