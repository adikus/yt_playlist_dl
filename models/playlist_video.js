exports.define = function(db) {
    return db.define("playlist_videos", {
        id          : Number,
        playlist_id : String,
        video_id    : String,
        user_id     : Number,
        position    : Number,
        status      : String
    }, {
        timestamp: true
    });
};
