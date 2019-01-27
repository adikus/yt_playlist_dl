exports.define = function(db) {
    return db.define("custom_video_uploads", {
        id        : Number,
        upload_id : Number,
        type      : String,
        playlist_video_id: Number
    }, {
        timestamp: true,
        methods: {
            stringify() {
                return {
                    id: this.id,
                    type: this.type,
                    upload: this.upload && this.upload.stringify()
                }
            }
        }
    });
};
