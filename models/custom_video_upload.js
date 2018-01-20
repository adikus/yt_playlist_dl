exports.define = function(db) {
    return db.define("custom_video_uploads", {
        id        : Number,
        video_id  : String,
        upload_id : Number,
        user_id   : Number,
        type      : String
    }, {
        timestamp: false
    });
};
