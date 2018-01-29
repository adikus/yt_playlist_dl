const fs = require('fs');
const path = require('path');

const download = require('./../services/download');

exports.define = function(db, app) {
    return db.define("uploads", {
        id        : Number,
        file_type : String,
        file      : String
    }, {
        timestamp: true,
        hooks: {
            afterLoad: function (next) {
                this.app = app;
                return next();
            }
        },
        methods: {
            S3Url: function() {
                return this.file && this.app.s3Bucket.url(this.file);
            },

            getFilename: function() {
                return this.file && path.parse(this.file).name;
            }
        }
    });
};

exports.createFromUrl = async function(app, urlObject) {
    let file = await download.run(urlObject.url);
    let upload = this.createFromFile(app, {path: file.path, ext: urlObject.ext});
    fs.unlink(file.path, () => {} );
    return upload;
};

exports.createFromFile = async function(app, fileObject) {
    let name = path.parse(fileObject.path).name;
    let key = await app.s3Bucket.uploadFileFromFS('uploads/' + name, fileObject.path, 'audio/' + fileObject.ext);
    return await app.models.upload.createAsync({
        file: key,
        file_type: fileObject.ext
    });
};
