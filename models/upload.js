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
            }
        }
    });
};

exports.createFromUrl = async function(app, urlObject) {
    let file = await download.run(urlObject.url);
    let name = path.parse(file.path).name;
    let key = await app.s3Bucket.uploadFileFromFS('uploads/' + name, file.path, 'audio/' + urlObject.ext);
    fs.unlink(file.path, () => {} );
    let upload = await app.models.upload.createAsync({
        file: key,
        file_type: urlObject.ext
    });
    return [upload, urlObject.format_id];
};
