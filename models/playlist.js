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
        album_cover: String
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
            getVideos: async function() {
                let playlistVideos = await this.app.models.playlist_video.findAsync({playlist_id: this.id, user_id: this.user_id}, {order: 'position'});
                let videoIds = _(playlistVideos).map(playlistVideo => playlistVideo.video_id).value();
                let videos = await this.app.models.video.findAsync({id: videoIds});
                videos = _(videos).sortBy((video) => {
                    let playlistVideo = _(playlistVideos).find({video_id: video.id});
                    video.playlistVideo = playlistVideo;
                    video.position = playlistVideo.position;
                    return video.position;
                }).value();
                return videos;
            },

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

exports.createOrUpdate = async function(req, playlist, item, callback) {
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
            if(key !== 'metadata') {
                playlist[key] = value;
            }else{
                playlist.metadata = _(playlist.metadata).merge(value);
                playlist.markAsDirty('metadata');
            }
        });

        playlist = await playlist.saveAsync();
    }else{
        playlist = await req.models.playlist.createAsync(params);
    }
    if(callback) {
        callback(playlist);
    }
    return playlist;
};

exports.getFromDbOrApi = async function(req, id, callback) {
    let playlist = await req.models.playlist.oneAsync({id: id});
    if(!playlist){
        let ytPlaylist = await YtPlaylist.get(id, req.session.ytAuth.access_token);
        playlist = await this.createOrUpdate(req, null, ytPlaylist);
    }

    if(callback) {
        callback(playlist);
    } else {
        return playlist;
    }
};
