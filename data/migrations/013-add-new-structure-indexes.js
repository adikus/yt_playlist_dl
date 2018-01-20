exports.up = function () {
    return this.addIndex('playlist_videos_playlist_id_idx', {
        table: 'playlist_videos',
        columns: ['playlist_id']
    }).then(() => {
        this.addIndex('playlist_videos_video_id_idx', {
            table: 'playlist_videos',
            columns: ['video_id']
        });
    }).then(() => {
        this.addIndex('custom_video_uploads_video_id_idx', {
            table: 'custom_video_uploads',
            columns: ['video_id']
        });
    }).then(() => {
        this.addIndex('custom_video_uploads_user_id_idx', {
            table: 'custom_video_uploads',
            columns: ['user_id']
        });
    });
};

exports.down = function (){
    return this.dropIndex('playlist_videos', 'playlist_videos_playlist_id_idx').then(() => {
        this.dropIndex('playlist_videos', 'playlist_videos_video_id_idx');
    }).then(() => {
        this.dropIndex('custom_video_uploads', 'custom_video_uploads_video_id_idx');
    }).then(() => {
        this.dropIndex('custom_video_uploads', 'custom_video_uploads_user_id_idx');
    });
};
