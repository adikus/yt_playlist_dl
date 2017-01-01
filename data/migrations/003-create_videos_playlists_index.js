exports.up = function (next) {
    this.addIndex('video_playlist_id_idx', {
        table: 'videos',
        columns: ['playlist_id']
    }, next);
};

exports.down = function (next){
    this.dropIndex('video_playlist_id_idx', 'videos', next);
};
