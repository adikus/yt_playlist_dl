const { exec, execFile } = require('child_process');
const util = require('util');
const fs = require('fs');
const crypto = require('crypto');
const stream = require('stream');
const path = require('path');

const aws = require('aws-sdk');

const s3 = new aws.S3();

async function execPromise(command) {
    return new Promise((resolve, reject) => {
        exec(command, {cwd: '/tmp', maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
            if(error){
                console.error(error);
                return reject(stderr);
            }
            resolve(stdout);
        });
    });
}

async function resolveYtInfo(id) {
    let output = await execPromise(`${path.join(__dirname, 'bin', 'yt-dlp')} --js-runtimes node -j --cache-dir /tmp/yt -- ${id}`);
    return JSON.parse(output);
}

function downloadYtTrack(id, format_id, error_callback) {
    let child = execFile(
        path.join(__dirname, 'bin', 'yt-dlp'),
        ['--js-runtimes node', '-f', format_id, '--cache-dir', '/tmp/yt', '-o', '-', '--', id],
        {cwd: '/tmp', maxBuffer: 1024 * 1024 * 1024, encoding: 'binary'},
        (err, stdout, stderr) => {
            if (err && error_callback) error_callback(err, stderr);
        }
    );
    return child.stdout;
}

module.exports.resolve = async function(event, context, callback) {
    let params = event;

    console.log("Invoking resolve function with params", params);

    let ytInfo = await resolveYtInfo(params.id);
    let format =
        ytInfo.formats.find(f => f.format_id === '171') ||
        ytInfo.formats.find(f => f.format_id === '251') ||
        ytInfo.formats.find(f => f.format_id === '140');
    let ext = format.ext;
    let format_id = format.format_id;

    console.log(`Identified format (${format_id}), downloading & uploading to S3...`);

    let transformFunction = (chunk, encoding, callback) => { callback(null, Buffer.from(chunk.toString(), 'binary')) };

    let passtrough = new stream.PassThrough();
    let downloadSuccess = true;
    let videoStream = downloadYtTrack(params.id, format_id, (err, stderr) => {
        downloadSuccess = false;
        console.log("An error happened during download", err, stderr);
    });
    let tranformStream = new stream.Transform({
        transform: transformFunction
    });
    videoStream.pipe(tranformStream).pipe(passtrough);
    passtrough.pause();

    await new aws.S3.ManagedUpload({
        params: {
            Bucket: process.env.BUCKET,
            Key: params.key,
            Body: passtrough,
            ACL: 'public-read',
            ContentType: `audio/${ext}`
        }
    }).promise();

    if (!downloadSuccess) {
        console.log("Deleting unsuccessfully downloaded file from S3");
        await s3.deleteObjects({ Bucket: this.name, Delete: { Objects: [{Key: params.key}] } }).promise();
        throw "An error happened during download";
    }

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
    let params = event;

    console.log("Invoking convert function with params", params);

    let download_filename = await downloadFromS3(params.source_key, `/tmp/${crypto.randomBytes(16).toString('hex')}`);

    console.log('Downloaded, converting...');

    let dest_filename = `/tmp/${crypto.randomBytes(16).toString('hex')}`;
    await execPromise(`ffmpeg -y -i ${download_filename} -f mp3 -b:a 128k ${dest_filename}`);

    let file = await util.promisify(fs.readFile)(dest_filename);

    console.log('Converted, uploading...');

    await s3.putObject({
        Bucket: process.env.BUCKET,
        Key: params.dest_key,
        Body: file,
        ACL: 'public-read',
        ContentType: 'audio/mp3'
    }).promise();


    callback(null, {key: params.dest_key});
};
