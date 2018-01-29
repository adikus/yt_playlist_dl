exports.up = function () {
    return this.addColumn('playlist_videos', {status: {type: 'text'}});
};

exports.down = function (){
    return this.dropColumn('playlist_videos', 'status');
};
