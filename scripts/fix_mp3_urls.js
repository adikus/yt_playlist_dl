require('dotenv').config();
const orm = require("orm");
const _ = require('lodash');
const Video = require('./../models/video');
const asyncPromise = require('./../lib/async-promise');

orm.connect(process.env.DATABASE_URL, async function (err, db) {
    if (err) throw err;

    let models = {};
    require('./../services/db').define(db, models, {models});

    await db.syncPromise();
    let videos = await models.video.allAsync();
    await Video.preload({models}, videos, 'mp3_upload_id', 'mp3Upload', 'upload');

    console.log('Copying metadata');

    await asyncPromise.eachLimit(videos, 4, async function(video) {
        if(video.metadata.s3_mp3_file){
            let pid = video.metadata.s3_mp3_playlist_id || video.playlist_id;
            if(pid){
                let mp3_file = 'playlists/' + pid + '/mp3/' + video.metadata.s3_mp3_file;
                let upload = video.mp3Upload;
                upload.file = mp3_file;
                await upload.saveAsync();
            } else {
                console.error(video.title);
            }
        }
        console.log(video.title);
    });

    console.log('Done');
});
