exports.up = function(next){
    this.addColumn('yt_sessions', {user_id: {type: 'integer'}}, next);
};

exports.down = function(next){
    this.dropColumn('yt_sessions', 'user_id', next);
};
