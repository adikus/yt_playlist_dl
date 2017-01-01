const s3 = require('s3');
const orm = require("orm");
const _ = require('lodash');

orm.connect(process.env.DATABASE_URL, function (err, db) {
    if (err) throw err;

    let models = {};
    require('./../services/db').define(db, models);

    db.sync(function(err) {
        if (err) throw err;

        models.video.all({}, function (err, videos) {
            if (err) throw err;

            console.log("Videos found:", videos.length);

            models.playlist.all({}, function (err, playlists) {
                if (err) throw err;

                console.log("Playlists found:", playlists.length);

                checkS3Contents(playlists, videos);
            });
        });
    });
});

function checkS3Contents(playlists, videos) {

    let client = s3.createClient({
        s3Options: {
            accessKeyId: process.env.S3_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_KEY,
            region: process.env.S3_REGION,
        }
    });

    let params = {
        s3Params: {
            Bucket: 'yt-playlist'
        }
    };

    let albumCovers = _(playlists)
        .map(playlist => { return [playlist.metadata.s3_album_cover, playlist.id] })
        .filter(pair => { return pair[0]})
        .fromPairs()
        .value();

    let tracks = _(videos)
        .map(video => { return [video.metadata.s3_file, {id: video.id, playlist: video.metadata.s3_playlist_id}] })
        .filter(pair => { return pair[0]})
        .fromPairs()
        .value();

    let mp3s = _(videos)
        .map(video => { return [video.metadata.s3_mp3_file, {id: video.id, playlist: video.metadata.s3_mp3_playlist_id}] })
        .filter(pair => { return pair[0]})
        .fromPairs()
        .value();

    let list = client.listObjects(params, true);
    list.on('data', function(data) {
        console.log('Received data:', data.Contents.length);
        let keys = _(data.Contents).map('Key').value();

        let keysToDelete = [];

        _(keys).each(function(key) {
            let keyParts = key.split('/');

            if(keyParts[0] == 'covers'){
                let playlist = albumCovers[keyParts[1]];
                if(!playlist){
                    console.log('Unable to find ', key);
                    keysToDelete.push(key);
                }
            }

            if(keyParts[0] == 'playlists'){
                if(keyParts.length < 4){
                    let track = tracks[keyParts[2]];
                    if(!track){
                        console.log('Unable to find ', key);
                        keysToDelete.push(key);
                    }
                }else{
                    let mp3 = mp3s[keyParts[3]];
                    if(!mp3){
                        console.log('Unable to find ', key);
                        keysToDelete.push(key);
                    }
                }

            }
        });

        if(keysToDelete.length){
            let deleteParams = {
                s3Params: {
                    Bucket: 'yt-playlist',
                    Delete: {
                        Objects: _(keysToDelete).map(key => { return { Key: key } }).value()
                    }
                }
            };

            console.log('Deleting', keysToDelete.length, 'files');

            let deleter = client.deleteObjects(deleteParams.s3Params);
            deleter.on('data', data => console.log(data) );
            deleter.on('end', () => console.log("Deleting finished") );
        }

    });
    list.on('end', function() {
        console.log("Listing finished");
    });
}
