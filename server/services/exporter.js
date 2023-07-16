const mkdirp = require('mkdirp');
const fs = require('fs');
const _ = require('lodash');
const exec = require('child_process').exec;
const JSZip = require("jszip");
const download = require('./../services/download');
const logger = require("../logger");

const asyncPromise = require('./../lib/async-promise');

const mkdirpPromise = function(dir) {
    return new Promise((resolve, reject) => {
        mkdirp(dir, function(err) {
            if(err) return reject(err);
            resolve();
        });
    });
};

const execPromise = function(command) {
    return new Promise((resolve, reject) => {
        exec(command, function (error, stdout, stderr){
            if(error) {
                logger.error(stderr);
                return reject(error);
            }
            resolve();
        });
    });
};

exports.exportAlbum = async function(playlist, items, indexes) {
    logger.log('Exporting album ' + playlist.title);
    let albumDir = 'dist/' + playlist.album_name;

    items = _(items).filter(item => { return indexes[item.id] > 0; } ).value();
    _(items).each((item) => { item.index = indexes[item.id]; });

    await mkdirpPromise('./temp/' + albumDir);

    let albumCoverFileName;
    if(playlist.coverImageUrl()){
        albumCoverFileName = albumDir + '/cover.jpg';
        await download.run(playlist.coverImageUrl(), albumCoverFileName);
    }
    let N = items.length;
    let files = [];

    await asyncPromise.eachLimit(items, 5, async function iteratee(item) {
        let name = item.playlistVideo.exportFileNameN(item.index);
        logger.log('Downloading ' + name);
        let finalFileName = albumDir + '/' + name;
        files.push('./temp/' + finalFileName);

        if (!fs.existsSync('./temp/' + finalFileName)) {
            let mp3Upload = await item.getMp3Upload();
            await download.run(mp3Upload.S3Url(), finalFileName + '.temp');
            logger.log('Tagging ' + name);
            fs.renameSync('./temp/' + finalFileName + '.temp', './temp/' + finalFileName);

            let command = 'mid3v2';
            command += ' -a "' + item.playlistVideo.getArtist() + '"';
            command += ' -A "' + playlist.album_name + '"';
            command += ' -t "' + item.playlistVideo.getTitle() + '"';
            command += ' -T ' + item.index + '/' + N;
            if(item.playlistVideo.getGenre() !== '') command += ' -g ' + item.playlistVideo.getGenre();
            if(playlist.coverImageUrl()) command += ' -p "./temp/' + albumCoverFileName + '::3:image/jpg"';
            command += ' "./temp/' + finalFileName + '"';

            await execPromise(command);
        }
    });

    let zip = new JSZip();
    _(files).each(function(file) {
        let name = _(file.split('/')).last();
        zip.file(name, fs.readFileSync(file));
    });
    let stream = zip.generateNodeStream({ streamFiles: true });
    stream.cleanUp = function() {
        logger.log('Cleaning up files.');
        _(files).each(file => fs.unlinkSync(file));
        fs.unlinkSync('./temp/' + albumDir + '/cover.jpg');
        fs.rmdirSync('./temp/' + albumDir);
    };

    return stream;
};
