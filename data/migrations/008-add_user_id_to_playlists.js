exports.up = function(next){
    this.addColumn('playlists', {user_id: {type: 'integer'}}, next);
};

exports.down = function(next){
    this.dropColumn('playlists', 'user_id', next);
};
