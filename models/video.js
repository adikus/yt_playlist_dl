const sanitize = require("sanitize-filename");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const _ = require('lodash');

const metadata_guesser = require('./../services/metadata_guesser');
const ytDl = require('./../services/yt_dl');
const download = require('./../services/download');
const mp3Convert = require('./../services/mp3_convert');

exports.define = function(db, app) {
    return db.define("videos", {
        id         : String,
        title      : String,
        status     : String,
        metadata   : { type: 'json' },
        position   : Number,
        playlist_id: String
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
            guessMetadata: function() {
                if(!this.guess){
                    this.guess = metadata_guesser.guess(this.title, this.metadata.channelTitle);
                }
                return this.guess;
            },

            uploadToS3: function(callback) {
                let self = this;

                console.log('Resolving ' + this.id + '(' + this.title + ')');
                ytDl.get(this.id)
                    .then( audioUrlObject => self.uploadToS3From(audioUrlObject, callback) )
                    .catch( err => console.log('Failed to download ' + self.id + '(' + self.title + ')', err) );
            },

            uploadToS3From: function(audioUrlObject, callback) {
                let self = this;

                console.log('Downloading ' + this.id + '(' + this.title + ')');
                download.run(audioUrlObject.url).then( file => {
                    console.log('Uploading ' + self.id + '(' + self.title + ')');
                    let name = path.parse(file.path).name;
                    return self.app.s3Bucket.uploadFileFromFS('playlists/' + self.playlist_id + '/' + name, file.path, 'audio/' + audioUrlObject.ext);
                }).then( key => {
                    let name = path.parse(key).name;
                    console.log('Uploaded ' + self.id + ' as ' + key);
                    fs.unlink('./temp/' + name, () => {} );
                    return self.saveAudioMetadata(name, audioUrlObject.ext, audioUrlObject.format_id, callback);
                });
            },

            convertAndUploadToS3: function(callback) {
                let self = this;

                if(!this.metadata.s3_file)return callback('no s3 file', this);

                console.log('Downloading ' + this.id + '(' + this.title + ')');
                let name = this.metadata.s3_file && path.parse(this.metadata.s3_file).name;
                download.run(this.S3Url(), name).then( file => {
                    console.log('Converting to mp3 ' + self.id + '(' + self.title + ')');
                    return mp3Convert.run(file);
                }).then( mp3Name => {
                    fs.unlink('./temp/' + name, () => {} );
                    return self.app.s3Bucket.uploadFileFromFS('playlists/' + self.playlist_id + '/mp3/' + mp3Name, './temp/' + mp3Name, 'audio/mp3');
                }).then( key => {
                    let name = path.parse(key).name;
                    console.log('Uploaded mp3 ' + self.id + ' as ' + key);
                    fs.unlink('./temp/' + name, () => {} );
                    return self.saveMp3Metadata(name, callback);
                });
            },

            uploadUserMp3ToS3: function(mp3File, callback) {
                let self = this;

                let mp3Name = crypto.randomBytes(16).toString('hex');
                mp3File.mv('./temp/' + mp3Name, function(err) {
                    if (err) throw err;

                    self.app.s3Bucket.uploadFileFromFS('playlists/' + self.playlist_id + '/mp3/' + mp3Name, './temp/' + mp3Name, 'audio/mp3')
                        .then( key => {
                            let name = path.parse(key).name;
                            console.log('Uploaded mp3 ' + self.id + ' as ' + key);
                            fs.unlink('./temp/' + name, () => {} );
                            return self.saveMp3Metadata(name, callback);
                        });
                });
            },

            saveMetadata: function(metadata, callback){
                this.metadata = _(this.metadata).merge(metadata);
                this.markAsDirty('metadata');

                this.save(function(err, record) {
                    if (err) throw err;
                    callback(null, record);
                });
            },

            saveAudioMetadata: function(name, ext, format_id, callback) {
                this.saveMetadata({
                    s3_file: name,
                    s3_ext: ext,
                    s3_format: format_id,
                    s3_playlist_id: this.playlist_id
                }, callback);
            },

            saveMp3Metadata: function(name, callback) {
                this.saveMetadata({
                    s3_mp3_file: name,
                    s3_mp3_playlist_id: this.playlist_id
                }, callback);
            },

            S3Url: function() {
                let pid = this.metadata.s3_playlist_id || this.playlist_id;
                return this.metadata.s3_file && this.app.s3Bucket.url('playlists/' + pid + '/' + this.metadata.s3_file);
            },

            S3Mp3Url: function() {
                let pid = this.metadata.s3_playlist_id || this.playlist_id;
                return this.metadata.s3_mp3_file && this.app.s3Bucket.url('playlists/' + pid + '/mp33/' + this.metadata.s3_mp3_file);
            },

            metaArtist: function() {
                return metadata_guesser.sanitizeArtist(this.metadata.artist || this.guessMetadata().artist);
            },

            metaTitle: function() {
                return this.metadata.title || this.guessMetadata().title;
            },

            metaGenre: function() {
                return this.metadata.genre || this.guessMetadata().genre;
            },

            exportFileName: function(i) {
                return sanitize(('00' + i).slice(-3) + " " + this.metaArtist() + " - " + this.metaTitle() + ".mp3");
            }
        }
    });
};


exports.createOrUpdate = function(req, playlistId, video, item, callback) {
    let params = {
        id: item.video.id,
        status: item.video.status.privacyStatus,
        title: item.video.snippet.title,
        metadata: {thumbnails: item.video.snippet.thumbnails, channelTitle: item.video.snippet.channelTitle},
        playlist_id: playlistId,
        position: item.snippet.position,
        created_at: new Date(item.video.snippet.publishedAt)
    };

    if(video) {
        _(params).each(function(value, key) {
            if(key != 'metadata') {
                video[key] = value;
            }else{
                video.metadata = _(video.metadata).merge(value);
                video.markAsDirty('metadata');
            }
        });

        video.save(function(err, record) {
            if (err) throw err;
            callback(record);
        })
    }else{
        req.models.video.create(params, function(err, record) {
            if (err) throw err;
            callback(record);
        });
    }
};
