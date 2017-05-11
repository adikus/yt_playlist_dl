const mkdirp = require('mkdirp');
const request = require('request');
const fs = require('fs');
const _ = require('lodash');
const exec = require('child_process').exec;
const async = require('async');
const JSZip = require("jszip");

exports.exportAlbum = function(playlist, items, indexes, callback) {
    console.log('Exporting album ' + playlist.title);
    let albumDir = './dist/' + playlist.metadata.album;

    items = _(items).filter(item => { return indexes[item.id] > 0; } ).value();
    _(items).each(function(item) { item.index = indexes[item.id]; });

    let done = function(err, files) {
        let zip = new JSZip();
        _(files).each(function(file) {
            let name = _(file.split('/')).last();
            zip.file(name, fs.readFileSync(file));
        });
        let stream = zip.generateNodeStream({streamFiles:true});
        callback(null, stream);
        stream.on('finish', function () {
            // Cleanup
            console.log('Cleaning up files.');
            _(files).each(file => fs.unlink(file, () => {} ));
        });
    };

    mkdirp(albumDir, function(err) {
        if(err) return callback(err);

        let albumCoverFileName = albumDir + '/cover.jpg';
        let albumFile = fs.createWriteStream(albumCoverFileName);
        let N = items.length;
        let files = [];
        request.get(playlist.coverImageUrl()).pipe(albumFile).on('finish', function() {

            async.eachLimit(items, 5, function iteratee(item, callback) {
                let name = item.exportFileNameN(item.index);
                console.log('Downloading ' + name);
                let finalFileName = albumDir + '/' + name;
                files.push(finalFileName);
                if (!fs.existsSync(finalFileName)) {
                    let file = fs.createWriteStream(finalFileName + '.temp');
                    request.get(item.S3Mp3Url()).pipe(file).on('finish', function() {
                        fs.renameSync(finalFileName + '.temp', finalFileName);
                        let command = 'mid3v2 -a "' + item.metaArtist() + '" -A "' + playlist.metadata.album + '" -t "' + item.metaTitle() + '" -T ' + item.index + '/' + N + ' -g ' + item.metaGenre() + ' -p "' + albumCoverFileName + '::3:image/jpg" "' + finalFileName + '"';
                        exec(command, function (error, stdout, stderr){
                            if(error) {
                                console.log(stderr);
                                throw error;
                            }
                            callback(null);
                        });
                    });
                } else {
                    callback(null);
                }
            }, function() {
                done(null, files);
            });
        });
    });
};