exports.define = function(db) {
    return db.define("yt_sessions", {
        id           : Number,
        access_token : String,
        refresh_token: String,
        expires_at   : Date
    }, {
        timestamp: false
    });
};
