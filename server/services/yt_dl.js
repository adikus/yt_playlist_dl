const exec = require('child_process').exec;
const _ = require('lodash');
const logger = require("../logger");

exports.get = function(id) {
    return new Promise(function (resolve, reject) {
        exec('lib/youtube-dl -j -- ' + id, {maxBuffer: 1024 * 1024}, function (error, stdout, stderr){
            if(stdout.length > 2){
                try {
                    let info = JSON.parse(stdout);
                    let format = (_(info.formats).find({format_id: '171'}) || _(info.formats).find({format_id: '140'}));
                    let url = format.url;
                    let ext = format.ext;
                    let format_id = format.format_id;

                    resolve({url: url, ext: ext, format_id: format_id});
                }
                catch(e) {
                    reject(e);
                }
            }else{
                logger.error(error, stderr);
                reject(error);
            }
        });
    });
};
