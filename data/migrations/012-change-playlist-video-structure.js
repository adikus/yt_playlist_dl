exports.up = function () {
    return this.createTable('playlist_videos', {
        id: { type : "serial", key: true },
        playlist_id: { type : "text", required: true },
        video_id : { type : "text", required: true },
        created_at: { type: 'date', time: true },
        updated_at: { type: 'date', time: true }
    }).then(() => {
        this.createTable('uploads', {
            id: { type : "serial", key: true },
            file_type: { type : "text", required: true },
            file: { type : "text" },
        })
    }).then(() => {
        this.createTable('custom_video_uploads', {
            id: { type : "serial", key: true },
            video_id: { type : "text", required: true },
            user_id: { type : "integer" },
            upload_id: { type : "integer", required: true },
            type: { type : "text" }
        })
    }).then(() => {
        this.addColumn('playlists', {album_name: {type: 'text'}});
    }).then(() => {
        this.addColumn('playlists', {album_cover: {type: 'text'}});
    }).then(() => {
        this.addColumn('videos', {original_upload_id: {type: 'integer'}});
    }).then(() => {
        this.addColumn('videos', {mp3_upload_id: {type: 'integer'}});
    });
};

exports.down = function (){
    return this.dropTable('playlist_videos').then(() => {
        this.dropTable('uploads')
    }).then(() => {
        this.dropTable('custom_video_uploads')
    }).then(() => {
        this.dropColumn('playlists', 'album_name');
    }).then(() => {
        this.dropColumn('playlists', 'album_cover');
    }).then(() => {
        this.dropColumn('videos', 'original_upload_id');
    }).then(() => {
        this.dropColumn('videos', 'mp3_upload_id');
    });
};
