exports.up = function () {
    return this.addColumn('playlist_videos', {position: {type: 'integer'}});
}

exports.down = function (){
    return this.dropColumn('playlist_videos', 'position');
};
