exports.up = function (next) {
    this.createTable('videos', {
        id     : { type : "text", key: true },
        title  : { type : "text", required: true },
        status : { type : "text", required: true },
        metadata: { type : "text" },
        playlist_id: { type : "text" },
        created_at: { type: 'date', time: true },
        updated_at: { type: 'date', time: true }
    }, next);
};

exports.down = function (next){
    this.dropTable('videos', next);
};
