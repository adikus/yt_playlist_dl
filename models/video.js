const sanitize = require("sanitize-filename");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const _ = require('lodash');

const metadataGuesser = require('./../services/metadata_guesser');
const ytDl = require('./../services/yt_dl');
const download = require('./../services/download');
const mp3Convert = require('./../services/mp3_convert');
const Upload = require('./upload');

exports.define = function(db, app) {
    return db.define("videos", {
        id         : String,
        title      : String,
        status     : String,
        metadata   : { type: 'json' },
        position   : Number,
        playlist_id: String,
        original_upload_id: Number,
        mp3_upload_id: Number
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
            getUpload: async function() {
                return this.app.models.upload.oneAsync({id: this.original_upload_id});
            },

            getMp3Upload: async function() {
                return this.app.models.upload.oneAsync({id: this.mp3_upload_id});
            },

            guessMetadata: function() {
                if(!this.guess){
                    this.guess = metadataGuesser.guess(this.title, this.metadata.channelTitle);
                }
                return this.guess;
            },

            uploadToS3: async function() {
                console.log('Resolving ' + this.id + ' (' + this.title + ')');
                let audioUrlObject = await ytDl.get(this.id);
                console.log('Uploading ' + this.id + ' (' + this.title + ')');
                let upload = await Upload.createFromUrl(this.app, audioUrlObject);
                this.original_upload_id = upload.id;
                this.metadata = _(this.metadata).merge({format_id: audioUrlObject.format_id});
                this.markAsDirty('metadata');
                await this.saveAsync();
            },

            convertAndUploadToS3: async function() {
                let upload = await this.getUpload();
                if(!upload) throw "Couldn't find the upload";

                console.log('Downloading ' + this.id + '(' + this.title + ')');
                let name = await upload.getFilename();
                let file = await download.run(upload.S3Url(), name);
                console.log('Converting to mp3 ' + this.id + '(' + this.title + ')');
                let mp3Path = await mp3Convert.run(file);
                console.log('Cleaning up download ' + this.id + '(' + this.title + ')');
                fs.unlink(file.path, () => {} );
                console.log('Uploading mp3 ' + this.id + '(' + this.title + ')');
                let mp3Upload = await Upload.createFromFile(this.app, {path: mp3Path, ext: 'mp3'});
                fs.unlink(mp3Path, () => {} );
                this.mp3_upload_id = mp3Upload.id;
                await this.saveAsync();
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

            saveMp3Metadata: function(name, callback) {
                this.saveMetadata({
                    s3_mp3_file: name,
                    s3_mp3_playlist_id: this.playlist_id
                }, callback);
            },

            // TODO: These should be defined on playlist_video
            metaArtist: function() {
                return metadataGuesser.sanitizeArtist(this.metadata.artist || this.guessMetadata().artist) || '';
            },

            metaTitle: function() {
                return this.metadata.title || this.guessMetadata().title || '';
            },

            metaGenre: function() {
                return this.metadata.genre || this.guessMetadata().genre || '';
            },

            exportFileName: function() {
                return sanitize(this.metaArtist() + " - " + this.metaTitle() + ".mp3");
            },

            exportFileNameN: function(i) {
                return sanitize(('00' + i).slice(-3)) + " " + this.exportFileName();
            }
        }
    });
};


exports.createOrUpdate = async function(req, video, item, callback) {
    let params = {
        id: item.video.id,
        title: item.video.snippet.title,
        metadata: {thumbnails: item.video.snippet.thumbnails, channelTitle: item.video.snippet.channelTitle},
        created_at: new Date(item.video.snippet.publishedAt),
        status: 'deprecated'
    };

    if(video) {
        _(params).each(function(value, key) {
            if(key !== 'metadata') {
                video[key] = value;
            }else{
                video.metadata = _(video.metadata).merge(value);
                video.markAsDirty('metadata');
            }
        });

        video = await video.saveAsync();
    }else{
        video = await req.models.video.createAsync(params);
    }
    if(callback) {
        callback(video);
    }
    return video;
};

exports.preload = async function(req, videos, key, name, model_name) {
    let ids = _(videos).map(key).compact().value();
    let instances = await req.models[model_name].findAsync({id: ids});
    _(videos).each((video) => {
        video[name] = _(instances).find({id: video[key]});
    });
};
