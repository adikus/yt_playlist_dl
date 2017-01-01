exports.up = function (next) {
    this.createTable('yt_sessions', {
        id     : { type : "serial", key: true },
        access_token: { type : "text", required: true },
        refresh_token: { type : "text" },
        expires_at: { type: 'date', time: true },
    }, next);
};

exports.down = function (next){
    this.dropTable('yt_sessions', next);
};
