exports.up = async function () {
    await this.addColumn('playlist_videos', {artist: {type: 'text'}});
    await this.addColumn('playlist_videos', {title: {type: 'text'}});
    await this.addColumn('playlist_videos', {genre: {type: 'text'}});
};

exports.down = async function (){
    await this.dropColumn('playlist_videos', 'artist');
    await this.dropColumn('playlist_videos', 'title');
    await this.dropColumn('playlist_videos', 'genre');
};
