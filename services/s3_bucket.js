const s3 = require('s3');

module.exports = function(bucket_name) {
    let client = s3.createClient({
        s3Options: {
            accessKeyId: process.env.S3_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_KEY,
            region: process.env.S3_REGION,
        }
    });

    return {
        client: client,
        name: bucket_name,

        uploadFileFromFS: function(key, filename, mimeType) {
            let params = {
                localFile: filename,
                s3Params: {
                    Bucket: this.name,
                    Key: key,
                    ACL: 'public-read',
                    ContentType: mimeType
                }
            };

            let self = this;

            return new Promise(function (resolve) {
                let uploader = self.client.uploadFile(params);

                uploader.on('end', function() {
                    resolve(key, filename);
                });
            });
        },

        removeFile: function(key) {
            let params = {
                Bucket: this.name,
                Delete: { Objects: [{Key: key}] }
            };

            let self = this;

            return new Promise(function (resolve) {
                self.client.deleteObjects(params).on('end', function() {
                    resolve(null);
                });
            });
        },

        url: function(key) {
            return 'http://' + this.name + '.s3-' + process.env.S3_REGION + '.amazonaws.com/' + key;
        }
    };
};
