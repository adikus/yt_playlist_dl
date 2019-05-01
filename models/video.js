const _ = require('lodash');

const resolveYt = require('./../services/lambdas').resolve;
const convertToMp3 = require('./../services/lambdas').convert;
const to = require('../lib/to').to;

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

            stringify: function() {
                return _(this).pick('id', 'title', 'metadata').extend({
                    playlistVideo: this.playlistVideo.stringify(),
                    originalUpload: this.originalUpload && this.originalUpload.stringify(),
                    mp3Upload: this.mp3Upload && this.mp3Upload.stringify(),
                    customUploads: this.customUploads.map((customUpload) => customUpload.stringify())
                }).value();
            },

            uploadToS3: async function() {
                console.log('Resolving ' + this.id + ' (' + this.title + ')');

                if(this.original_upload_id){
                    console.log('Removing old upload for ' + this.id + ' (' + this.title + ')');
                    let originalUpload = await this.getUpload();
                    await app.s3Bucket.removeFile(originalUpload.file);
                    this.original_upload_id = null;
                    await this.saveAsync();
                }

                let [err, response] = await to(resolveYt(this.id));
                if(err) {
                    return console.log('Failed to resolve ' + this.id + ' (' + this.title + ')');
                }
                let upload = await this.app.models.upload.createAsync({
                    file: response.key,
                    file_type: response.ext
                });
                console.log('Saving upload for ' + this.id + ' (' + this.title + ')');
                this.original_upload_id = upload.id;
                this.metadata = _(this.metadata).merge({format_id: response.format_id});
                this.markAsDirty('metadata');
                await this.saveAsync();
            },

            convertAndUploadToS3: async function() {
                console.log('Converting to mp3 ' + this.id + '(' + this.title + ')');

                if(this.mp3_upload_id){
                    console.log('Removing old mp3 upload for ' + this.id + ' (' + this.title + ')');
                    let mp3Upload = await this.getMp3Upload();
                    await app.s3Bucket.removeFile(mp3Upload.file);
                    this.mp3_upload_id = null;
                    await this.saveAsync();
                }

                let upload = await this.getUpload();
                if(!upload) throw "Couldn't find the upload";

                let response = await convertToMp3(upload.file);
                let mp3Upload = await this.app.models.upload.createAsync({
                    file: response.key,
                    file_type: 'mp3'
                });

                console.log('Saving mp3 upload for ' + this.id + ' (' + this.title + ')');
                this.mp3_upload_id = mp3Upload.id;
                await this.saveAsync();
            }
        }
    });
};


exports.createOrUpdate = async function(req, video, item, callback) {
    let params = {
        id: item.video.id,
        title: item.video.snippet.title,
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
