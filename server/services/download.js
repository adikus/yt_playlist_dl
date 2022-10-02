const crypto = require('crypto');
const request = require('request');
const fs = require('fs');

exports.run = function(url, name) {
    return new Promise(function (resolve) {
        name = name || crypto.randomBytes(16).toString('hex');
        let file = fs.createWriteStream('./temp/' + name);
        request.get(url).pipe(file).on('finish', function() {
            resolve(file)
        });
    });
};
