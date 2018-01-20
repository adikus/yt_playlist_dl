const crypto = require('crypto');
const _ = require('lodash');

const YtPlaylist = require('./yt_playlist');

exports.define = function(db, app) {
    return db.define("playlists", {
        id         : String,
        title      : String,
        status     : String,
        metadata   : { type: 'json' },
        user_id    : Number,
        album_name : String,
        album      : String
    }, {
        id: 'id',
        timestamp: true,
        hooks: {
            afterLoad: function (next) {
                this.app = app;
                return next();
            }
        },
        methods: {
            uploadAlbumCover: function(imageFile, callback) {
                let self = this;

                let name = crypto.randomBytes(16).toString('hex');
                imageFile.mv('./temp/' + name, function(err) {
                    if (err) throw err;

                    console.log('Uploading cover for playlist', self.title);
                    self.app.s3Bucket.uploadFileFromFS('covers/' + name, './temp/' + name, imageFile.mimeType)
                        .then(() => {
                            self.metadata.s3_album_cover = name;
                            self.markAsDirty('metadata');
                            self.save(function(err, record) {
                                console.log('Uploaded cover art ' + self.id + ' as covers/' + name);
                                if (err) throw err;
                                callback(null, record);
                            });
                        });
                });
            },

            coverImageUrl: function() {
                return this.metadata.s3_album_cover && this.app.s3Bucket.url('covers/' + this.metadata.s3_album_cover)
            }
        }
    });
};

exports.createOrUpdate = function(req, playlist, item, callback) {
    let params = {
        id: item.id,
        status: item.status.privacyStatus,
        title: item.snippet.title,
        metadata: {thumbnails: item.snippet.thumbnails},
        created_at: new Date(item.snippet.publishedAt),
        user_id: req.user.id
    };

    if(playlist) {
        _(params).each(function(value, key) {
            if(key != 'metadata') {
                playlist[key] = value;
            }else{
                playlist.metadata = _(playlist.metadata).merge(value);
                playlist.markAsDirty('metadata');
            }
        });

        playlist.save(function(err, record) {
            if (err) throw err;
            callback(record);
        })
    }else{
        req.models.playlist.create(params, function(err, record) {
            if (err) throw err;
            callback(record);
        });
    }
};

exports.getFromDbOrApi = function(req, id, callback) {
    let self = this;

    req.models.playlist.one({id: id}, function(err, playlist) {
        if (err) throw err;

        if(playlist){
            callback(playlist);
        } else {
            YtPlaylist.get(id, req.session.ytAuth.access_token, function(item) {
                self.createOrUpdate(req, null, item, function(playlist) {
                    callback(playlist);
                });
            });
        }
    });
};
