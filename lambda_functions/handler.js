const { exec, execFile } = require('child_process');
const util = require('util');
const fs = require('fs');
const crypto = require('crypto');
const stream = require('stream');

const aws = require('aws-sdk');

const s3 = new aws.S3();

async function execPromise(command) {
    return new Promise((resolve, reject) => {
        exec(command, {cwd: '/tmp', maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
            if(error){
                return reject(stderr);
            }
            resolve(stdout);
        });
    });
}

async function resolveYtInfo(id) {
    let output = await execPromise(`/var/task/bin/youtube-dl -j --cache-dir /tmp/yt -- ${id}`);
    return JSON.parse(output);
}

function downloadYtTrack(id, format_id) {
    let child = execFile(
        '/var/task/bin/youtube-dl',
        ['-f', format_id, '--cache-dir', '/tmp/yt', '-o', '-', '--', id],
        {cwd: '/tmp', maxBuffer: 1024 * 1024 * 1024, encoding: 'binary'},
        (err, stdout, stderr) => {
            if (err) {
                console.log(err, stdout.length, stderr);
            }
        }
    );
    return child.stdout;
}

module.exports.resolve = async function(event, context, callback) {
    let params = JSON.parse(event.body || "{}");

    console.log("Invoking resolve function with params", params);

    let ytInfo = await resolveYtInfo(params.id);
    let format = ytInfo.formats.find(f => f.format_id === '171') || ytInfo.formats.find(f => f.format_id === '140');
    let ext = format.ext;
    let format_id = format.format_id;

    console.log('Identified format, downloading & uploading to S3...');

    let transformFunction = (chunk, encoding, callback) => { callback(null, new Buffer(chunk.toString(), 'binary')) };

    let passtrough = new stream.PassThrough();
    let videoStream = downloadYtTrack(params.id, format_id);
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

    let download_filename = await downloadFromS3(params.source_key, `/tmp/${crypto.randomBytes(16).toString('hex')}`);

    console.log('Downloaded, converting...');

    let dest_filename = `/tmp/${crypto.randomBytes(16).toString('hex')}`;
    await execPromise(`./bin/ffmpeg/ffmpeg -y -i ${download_filename} -f mp3 -b:a 128k ${dest_filename}`);

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

