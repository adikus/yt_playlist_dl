exports.up = function (next) {
    this.addIndex('yt_session_user_id_idx', {
        table: 'yt_sessions',
        columns: ['user_id']
    }, next);
};

exports.down = function (next){
    this.dropIndex('yt_session_user_id_idx', 'yt_sessions', next);
};
