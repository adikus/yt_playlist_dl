const _ = require('lodash');
const sanitize = require("sanitize-filename");
const crypto = require('crypto');

const metadataGuesser = require('./../services/metadata_guesser');
const moveFilePromise = require('./../lib/move_uploaded').moveFilePromise;
const Upload = require('./upload');

exports.define = function(db, app) {
    return db.define("playlist_videos", {
        id          : Number,
        playlist_id : String,
        video_id    : String,
        user_id     : Number,
        position    : Number,
        status      : String,
        artist      : String,
        title       : String,
        genre       : String
    }, {
        timestamp: true,
        hooks: {
            afterLoad: function (next) {
                this.app = app;
                return next();
            }
        },
        methods: {
            guessMetadata: function() {
                if(!this.guess){
                    this.guess = metadataGuesser.guess(this.video.title, this.video.metadata.channelTitle);
                }
                return this.guess;
            },

            getArtist: function() {
                return metadataGuesser.sanitizeArtist(this.artist || this.guessMetadata().artist) || '';
            },

            getTitle: function() {
                return this.title || this.guessMetadata().title || '';
            },

            getGenre: function() {
                return this.genre || this.guessMetadata().genre || '';
            },

            exportFileName: function() {
                return sanitize(this.getArtist() + " - " + this.getTitle() + ".mp3");
            },

            exportFileNameN: function(i) {
                return sanitize(('00' + i).slice(-3)) + " " + this.exportFileName();
            },

            uploadCustomFile: async function(file, ext, type) {
                let name = crypto.randomBytes(16).toString('hex');
                await moveFilePromise(file, './temp/' + name);
                let upload = await Upload.createFromFile(this.app, {path: './temp/' + name, ext: ext});
                this.app.models.custom_video_upload.createAsync({
                    upload_id: upload.id,
                    playlist_video_id: this.id,
                    type
                });
            },

            stringify: function() {
                return _(this).pick('id', 'playlist_id', 'video_id', 'user_id', 'position', 'status', 'artist', 'title', 'genre').extend({
                    guessedMetadata: this.guessMetadata()
                }).value();
            }
        }
    });
};

exports.createOrUpdate = async function (req, playlistVideo, playlist, video, item, callback) {
    let params = {
        playlist_id: playlist.id,
        video_id: video.id,
        user_id: playlist.user_id,
        position: item.snippet.position,
        status: item.video.status ? item.video.status.privacyStatus : 'deleted'
    };

    if(playlistVideo) {
        _(params).each(function(value, key) {
            video[key] = value;
        });

        playlistVideo = await playlistVideo.saveAsync();
    }else{
        playlistVideo = await req.models.playlist_video.createAsync(params);
    }
    if(callback) {
        callback(playlistVideo);
    }
    return playlistVideo;
};
