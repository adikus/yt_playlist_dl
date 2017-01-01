const mkdirp = require('mkdirp');
const request = require('request');
const fs = require('fs');
const _ = require('lodash');
const exec = require('child_process').exec;
const async = require('async');

exports.exportAlbum = function(playlist, items, callback) {
    console.log('Exporting album ' + playlist.title);
    let albumDir = './dist/' + playlist.metadata.album;

    let i = 1;
    _(items).each(function(item) { item.index = i++; });

    mkdirp(albumDir, function(err) {
        if(err) return callback(err);

        let albumCoverFileName = albumDir + '/cover.jpg';
        let albumFile = fs.createWriteStream(albumCoverFileName);
        let N = items.length;
        request.get(playlist.coverImageUrl()).pipe(albumFile).on('finish', function() {

            async.eachLimit(items, 5, function iteratee(item, callback) {
                let name = item.exportFileName(item.index);
                console.log('Downloading ' + name);
                let finalFileName = albumDir + '/' + name;
                let file = fs.createWriteStream(finalFileName);
                request.get(item.S3Mp3Url()).pipe(file).on('finish', function() {
                    let command = 'mid3v2 -a "' + item.metaArtist() + '" -A "' + playlist.metadata.album + '" -t "' + item.metaTitle() + '" -T ' + item.index + '/' + N + ' -g ' + item.metaGenre() + ' -p "' + albumCoverFileName + '::3:image/jpg" "' + finalFileName + '"';
                    exec(command, function (error, stdout, stderr){
                        if(error) {
                            console.log(stderr);
                            throw error;
                        }
                        callback(null);
                    });
                });
            }, function() {
                callback(null);
            });
        });
    });
};