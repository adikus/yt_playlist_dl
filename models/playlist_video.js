const _ = require('lodash');

exports.define = function(db, app) {
    return db.define("playlist_videos", {
        id          : Number,
        playlist_id : String,
        video_id    : String,
        user_id     : Number,
        position    : Number,
        status      : String
    }, {
        timestamp: true,
        hooks: {
            afterLoad: function (next) {
                this.app = app;
                return next();
            }
        },
    });
};

exports.createOrUpdate = async function (req, playlistVideo, playlist, video, item, callback) {
    let params = {
        playlist_id: playlist.id,
        video_id: video.id,
        user_id: playlist.user_id,
        position: item.snippet.positio,
        status: item.video.status.privacyStatus
    };

    if(playlistVideo) {
        _(params).each(function(value, key) {
            video[key] = value;
        });

        playlistVideo = await playlistVideo.saveAsync();
    }else{
        playlistVideo = await req.models.playlist_video.createAsync(params);
    }
    if(callback) {
        callback(playlistVideo);
    }
    return playlistVideo;
};
