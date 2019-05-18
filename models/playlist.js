const crypto = require('crypto');
const _ = require('lodash');

const YtPlaylist = require('./yt_playlist');
const moveFilePromise = require('./../lib/move_uploaded').moveFilePromise;

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
                let conditions = {playlist_id: this.id, user_id: this.user_id};
                let playlistVideos = await this.app.models.playlist_video.findAsync(conditions, {order: 'position'});
                let videoIds = _(playlistVideos).map(playlistVideo => playlistVideo.video_id).value();
                let videos = await this.app.models.video.findAsync({id: videoIds});
                videos = _(videos).sortBy((video) => {
                    let playlistVideo = _(playlistVideos).find({video_id: video.id});
                    video.playlistVideo = playlistVideo;
                    playlistVideo.video = video;
                    video.position = playlistVideo.position;
                    return video.position;
                }).value();
                return videos;
            },

            getOldVideoIds: async function() {
                let condition = 't1.created_at < NOW() - interval \'2 months\' AND t2.original_upload_id IS NOT NULL';
                let oldVideos =
                    await this.app.models
                        .playlist_video
                        .findByVideo({})
                        .where({__sql: [[condition, []]]})
                        .find({playlist_id: this.id})
                        .findAsync();
                return _(oldVideos).map('video_id').value();
            },

            uploadAlbumCover: async function(imageFile) {
                let name = crypto.randomBytes(16).toString('hex');
                await moveFilePromise(imageFile, './temp/' + name);
                console.log('Uploading cover for playlist', this.title);
                await this.app.s3Bucket.uploadFileFromFS('covers/' + name, './temp/' + name);
                this.album_cover = name;
                await this.saveAsync();
            },

            coverImageUrl: function() {
                return this.album_cover && this.app.s3Bucket.url('covers/' + this.album_cover)
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
