const exec = require('child_process').exec;
const util = require('util');
const fs = require('fs');

const aws = require('aws-sdk');

const s3 = new aws.S3();

async function execPromise(command) {
    return new Promise((resolve, reject) => {
        exec(command, {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
            if(error){
                return reject(stderr);
            }
            resolve(stdout);
        });
    });
}

async function resolveYtInfo(id) {
    let output = await execPromise(`bin/youtube-dl -j --no-cache-dir -- ${id}`);
    return JSON.parse(output);
}

async function downloadYtTrack(id, format_id) {
    let filename = '/tmp/yt_track';
    await execPromise(`bin/youtube-dl -f ${format_id} --no-cache-dir -o ${filename} -- ${id}`);
    return filename;
}

module.exports.resolve = async function(event, context, callback) {
    let params = JSON.parse(event.body || "{}");

    console.log("Invoking resolve function with params", params);

    let ytInfo = await resolveYtInfo(params.id);
    let format = ytInfo.formats.find(f => f.format_id === '171') || ytInfo.formats.find(f => f.format_id === '140');
    let ext = format.ext;
    let format_id = format.format_id;

    console.log('Identified format, downloading...');

    let filename = await downloadYtTrack(params.id, format_id);
    let file = await util.promisify(fs.readFile)(filename);

    console.log('Downloaded, uploading...');

    await s3.putObject({
        Bucket: process.env.BUCKET,
        Key: params.key,
        Body: file,
    }).promise();

    callback(null, {ext, format_id, key: params.key});
};

async function downloadFromS3(key, filename) {
    return new Promise((resolve) => {
        let file = require('fs').createWriteStream(filename);
        s3.getObject({
            Bucket: process.env.BUCKET,
            Key: key
        })
            .createReadStream()
            .pipe(file)
            .on('close', () => {
            resolve(filename)
        })
    });
}

module.exports.convert = async function(event, context, callback) {
    let params = JSON.parse(event.body || "{}");

    console.log("Invoking convert function with params", params);

    let download_filename = await downloadFromS3(params.source_key, '/tmp/source_file');

    console.log('Downloaded, converting...');

    let dest_filename = '/tmp/dest_file';
    await execPromise(`./bin/ffmpeg/ffmpeg -y -i ${download_filename} -f mp3 -b:a 128k ${dest_filename}`);

    let file = await util.promisify(fs.readFile)(dest_filename);

    console.log('Converted, uploading...');

    await s3.putObject({
        Bucket: process.env.BUCKET,
        Key: params.dest_key,
        Body: file,
    }).promise();


    callback(null, {key: params.dest_key});
};

