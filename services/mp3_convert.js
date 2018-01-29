const crypto = require('crypto');
const exec = require('child_process').exec;

exports.run = function(file, mp3Name) {
    return new Promise(function (resolve, reject) {
        mp3Name = mp3Name || crypto.randomBytes(16).toString('hex');
        let mp3Path = './temp/' + mp3Name;
        exec('ffmpeg -i ' + file.path + ' -f mp3 -b:a 128k ' + mp3Path, function (error, stdout, stderr){
            if(error) {
                console.log(error, stderr);
                return reject(error);
            } else {
                resolve(mp3Path);
            }
        });
    });
};
