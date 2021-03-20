exports.up = async function () {
    await this.addColumn('playlists', {autoupdate: {type: 'boolean'}});
};

exports.down = async function (){
    await this.dropColumn('playlists', {autoupdate: {type: 'boolean'}});
};
