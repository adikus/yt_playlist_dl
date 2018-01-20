exports.up = function () {
    return this.addColumn('playlist_videos', {user_id: {type: 'integer'}}).then(() => {
        this.addIndex('playlist_videos_user_id_idx', {
            table: 'playlist_videos',
            columns: ['user_id']
        });
    }).then(() => {
        this.addColumn('uploads', {created_at: { type: 'date', time: true }});
    }).then(() => {
        this.addColumn('uploads', {updated_at: { type: 'date', time: true }});
    }).then(() => {
        this.addColumn('custom_video_uploads', {created_at: { type: 'date', time: true }});
    }).then(() => {
        this.addColumn('custom_video_uploads', {updated_at: { type: 'date', time: true }});
    }).then(() => {
        this.dropIndex('custom_video_uploads', 'custom_video_uploads_video_id_idx');
    }).then(() => {
        this.dropIndex('custom_video_uploads', 'custom_video_uploads_user_id_idx');
    }).then(() => {
        this.dropColumn('custom_video_uploads', 'video_id');
    }).then(() => {
        this.dropColumn('custom_video_uploads', 'user_id');
    }).then(() => {
        this.addColumn('custom_video_uploads', {playlist_video_id: { type: 'integer' }});
    }).then(() => {
        this.addIndex('custom_video_uploads_playlist_video_id_idx', {
            table: 'custom_video_uploads',
            columns: ['playlist_video_id']
        });
    });
};

exports.down = function (){
    return this.dropColumn('playlist_videos', 'user_id').then(() => {
        this.dropIndex('playlist_videos', 'playlist_videos_user_id_idx');
    }).then(() => {
        this.dropColumn('uploads', 'created_at');
    }).then(() => {
        this.dropColumn('uploads', 'updated_at');
    }).then(() => {
        this.dropColumn('custom_video_uploads', 'created_at');
    }).then(() => {
        this.dropColumn('custom_video_uploads', 'updated_at');
    }).then(() => {
        this.addColumn('custom_video_uploads', {user_id: { type: 'integer' }});
    }).then(() => {
        this.addColumn('custom_video_uploads', {video_id: { type: 'text' }});
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
    }).then(() => {
        this.dropColumn('custom_video_uploads', 'playlist_video_id');
    }).then(() => {
        this.dropIndex('custom_video_uploads', 'custom_video_uploads_playlist_video_id_idx');
    });
};
