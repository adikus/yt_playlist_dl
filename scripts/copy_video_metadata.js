require('dotenv').config();
const orm = require("orm");
const _ = require('lodash');
const Video = require('./../models/video');
const asyncPromise = require('./../lib/async-promise');
const metadataGuesser = require('./../services/metadata_guesser');

orm.connect(process.env.DATABASE_URL, async function (err, db) {
    if (err) throw err;

    let models = {};
    require('./../services/db').define(db, models, {models});

    await db.syncPromise();
    let playlistVideos = await models.playlist_video.allAsync();
    await Video.preload({models}, playlistVideos, 'video_id', 'video', 'video');

    console.log('Copying metadata');

    await asyncPromise.eachLimit(playlistVideos, 4, async function(playlistVideo) {
        playlistVideo.artist = metadataGuesser.sanitizeArtist(playlistVideo.video.metadata.artist);
        playlistVideo.title = playlistVideo.video.metadata.title;
        playlistVideo.genre = playlistVideo.video.metadata.genre;
        await playlistVideo.saveAsync();
        console.log(playlistVideo.video.title, playlistVideo.artist, playlistVideo.title, playlistVideo.genre);
    });

    console.log('Done');
});
