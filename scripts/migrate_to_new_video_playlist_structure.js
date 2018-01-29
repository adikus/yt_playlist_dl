require('dotenv').config();
const orm = require("orm");
const _ = require('lodash');

orm.connect(process.env.DATABASE_URL, function (err, db) {
    if (err) throw err;

    let models = {};
    require('./../services/db').define(db, models);

    let playlist_users = {};

    db.syncPromise().then(() => {
        return models.playlist.allAsync();
    }).then((playlists) => {
        console.log("Playlists found:", playlists.length);

        Promise.all(_(playlists).map(async (playlist) => {
            playlist_users[playlist.id] = playlist.user_id;

            playlist.album_name = playlist.metadata && playlist.metadata.album;
            playlist.album_cover = playlist.metadata && playlist.metadata.s3_album_cover;
            await playlist.saveAsync();
        }).value());
    }).then(() => {
        return models.video.allAsync();
    }).then((videos) => {
        console.log("Videos found:", videos.length);

        return Promise.all(_(videos).map(async (video) => {
            // let pid = video.metadata.s3_playlist_id || video.playlist_id;
            //
            // let file = video.metadata.s3_file;
            // let file_type = video.metadata.s3_ext;
            // if(file){
            //     file = 'playlists/' + pid + '/' + file;
            //     let upload = await models.upload.oneAsync({file: file});
            //     if(!upload){
            //         console.log('Creating upload for video ' + video.title);
            //         upload = await models.upload.createAsync({file: file, file_type: file_type, created_at: video.created_at});
            //     } else {
            //         upload.created_at = video.created_at;
            //         upload.saveAsync();
            //     }
            //     video.original_upload_id = upload.id;
            // }
            //
            // let mp3_file = video.metadata.s3_mp3_file;
            // if(mp3_file){
            //     mp3_file = 'playlists/' + pid + '/mp3/' + mp3_file;
            //     let mp3_upload = await models.upload.oneAsync({file: mp3_file});
            //     if(!mp3_upload){
            //         console.log('Creating mp3 upload for video ' + video.title);
            //         mp3_upload = await models.upload.createAsync({file: mp3_file, file_type: 'mp3', created_at: video.created_at});
            //     } else {
            //         mp3_upload.created_at = video.created_at;
            //         mp3_upload.saveAsync();
            //     }
            //     video.mp3_upload_id = mp3_upload.id;
            // }
            // await video.saveAsync();
            // console.log('Saving video ' + video.title);

            let playlist_video = await models.playlist_video.oneAsync({playlist_id: video.playlist_id, video_id: video.id});
            if(!playlist_video){
                console.log('Creating playlist video for ' + video.title);
                await models.playlist_video.createAsync({
                    playlist_id: video.playlist_id,
                    video_id: video.id,
                    user_id: playlist_users[video.playlist_id],
                    created_at: video.created_at,
                    position: video.position
                });
            } else {
                playlist_video.position = video.position;
                playlist_video.status = video.status;
                playlist_video.created_at = video.created_at;
                await playlist_video.saveAsync();
            }
        }).value());
    }).then(() => {
        console.log('Done');
    });
});
