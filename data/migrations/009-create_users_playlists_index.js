exports.up = function (next) {
    this.addIndex('playlist_user_id_idx', {
        table: 'playlists',
        columns: ['user_id']
    }, next);
};

exports.down = function (next){
    this.dropIndex('playlist_user_id_idx', 'playlists', next);
};
