const fs = require('fs');
const _ = require('lodash');

const ytDl = require('./../services/yt_dl');
const download = require('./../services/download');
const mp3Convert = require('./../services/mp3_convert');
const Upload = require('./upload');
const to = require('../lib/to');

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

            uploadToS3: async function() {
                // TODO: check for existing and delete

                console.log('Resolving ' + this.id + ' (' + this.title + ')');
                let [err, audioUrlObject] = await to(ytDl.get(this.id));
                if(err) {
                    return console.log('Failed to resolve ' + this.id + ' (' + this.title + ')');
                }
                console.log('Uploading ' + this.id + ' (' + this.title + ')');
                let upload = await Upload.createFromUrl(this.app, audioUrlObject);
                console.log('Saving upload for ' + this.id + ' (' + this.title + ')');
                this.original_upload_id = upload.id;
                this.metadata = _(this.metadata).merge({format_id: audioUrlObject.format_id});
                this.markAsDirty('metadata');
                await this.saveAsync();
            },

            convertAndUploadToS3: async function() {
                // TODO: check for existing and delete

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
