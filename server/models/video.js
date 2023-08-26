const _ = require('lodash');

const resolveYt = require('./../services/lambdas').resolve;
const convertToMp3 = require('./../services/lambdas').convert;
const to = require('../lib/to').to;
const logger = require('../logger');

exports.define = function(db, app) {
    return db.define("videos", {
        id         : String,
        title      : String,
        channel      : String,
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
                if (!this.original_upload_id) return null;
                return this.app.models.upload.oneAsync({id: this.original_upload_id});
            },

            getMp3Upload: async function() {
                if (!this.mp3_upload_id) return null;
                return this.app.models.upload.oneAsync({id: this.mp3_upload_id});
            },

            stringify: function() {
                return _(this).pick('id', 'title', 'channel', 'metadata').extend({
                    playlistVideo: this.playlistVideo.stringify(),
                    originalUpload: this.originalUpload && this.originalUpload.stringify(),
                    mp3Upload: this.mp3Upload && this.mp3Upload.stringify(),
                    customUploads: this.customUploads.map((customUpload) => customUpload.stringify())
                }).value();
            },

            uploadToS3: async function() {
                logger.log('Resolving ' + this.id + ' (' + this.title + ')');

                if(this.original_upload_id){
                    logger.log('Removing old upload for ' + this.id + ' (' + this.title + ')');
                    let originalUpload = await this.getUpload();
                    await app.s3Bucket.removeFile(originalUpload.file);
                    this.original_upload_id = null;
                    await this.saveAsync();
                }

                let [err, response] = await to(resolveYt(this.id));
                if(err) {
                    return logger.log('Failed to resolve ' + this.id + ' (' + this.title + ')');
                }
                let upload = await this.app.models.upload.createAsync({
                    file: response.key,
                    file_type: response.ext
                });
                logger.log('Saving upload for ' + this.id + ' (' + this.title + ')');
                this.original_upload_id = upload.id;
                this.metadata = _(this.metadata).merge({format_id: response.format_id});
                this.markAsDirty('metadata');
                await this.saveAsync();
            },

            convertAndUploadToS3: async function() {
                logger.log('Converting to mp3 ' + this.id + '(' + this.title + ')');

                if(this.mp3_upload_id){
                    logger.log('Removing old mp3 upload for ' + this.id + ' (' + this.title + ')');
                    let mp3Upload = await this.getMp3Upload();
                    if(mp3Upload.file) {
                        await app.s3Bucket.removeFile(mp3Upload.file);
                    }
                    this.mp3_upload_id = null;
                    await this.saveAsync();
                }

                let upload = await this.getUpload();
                if(!upload) throw `Couldn't find the upload for ${this.title}(${this.id})`;

                let response = await convertToMp3(upload.file);
                let mp3Upload = await this.app.models.upload.createAsync({
                    file: response.key,
                    file_type: 'mp3'
                });

                logger.log('Saving mp3 upload for ' + this.id + ' (' + this.title + ')');
                this.mp3_upload_id = mp3Upload.id;
                await this.saveAsync();
            },

            asJson() {
                const obj = {
                    playlistVideo: _(this.playlistVideo).pick(_.keys(this.app.models.playlist_video.properties)),
                    ..._(this).pick(_.keys(this.app.models.video.properties).concat(['originalUpload', 'mp3Upload'])).value()
                };

                if (this.originalUpload) {
                    this.originalUpload.url = this.originalUpload.S3Url();
                    obj.originalUpload = _(this.originalUpload).pick(_.keys(this.app.models.upload.properties).concat(['url'])).value()
                }

                if (this.mp3Upload) {
                    this.mp3Upload.url = this.mp3Upload.S3Url();
                    obj.mp3Upload = _(this.mp3Upload).pick(_.keys(this.app.models.upload.properties).concat(['url'])).value()
                }

                return obj;
            }
        }
    });
};


exports.createOrUpdate = async function(req, video, item, callback) {
    let params = {
        id: item.video.id,
        title: item.video.snippet.title,
        channel: item.video.snippet.channelTitle,
        metadata: {thumbnails: item.video.snippet.thumbnails, channelTitle: item.video.snippet.channelTitle},
        created_at: item.video.snippet.publishedAt ? new Date(item.video.snippet.publishedAt) : null,
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

        try {
            video = await video.saveAsync();
        } catch (err) {
            logger.error("Couldn't update video ", params, err.message);
        }
    }else{
        try {
            video = await req.models.video.createAsync(params);
        } catch (err) {
            if (err.message.indexOf('duplicate key value violates unique constraint "videos_pkey"') > -1) {
                return this.createOrUpdate(req, video, item, callback);
            } else {
                logger.error("Couldn't create video ", params, err.message);
            }
        }

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

exports.preloadCustomUploads = async function(req, videos) {
    let ids = _(videos).map('playlistVideo').map('id').compact().value();
    let customUploads = await req.models.custom_video_upload.findAsync({ playlist_video_id: ids });
    await this.preload(req, customUploads, 'upload_id', 'upload', 'upload');
    _(videos).each( (video) => video.customUploads = [] );
    _(customUploads).each((upload) => {
        let video = _(videos).find( (video) => { return video.playlistVideo.id === upload.playlist_video_id } );
        video.customUploads.push(upload);
    });
};
