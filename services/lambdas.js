const aws = require('aws-sdk');
const lambda = new aws.Lambda({region: process.env.LAMBDA_REGION});
const crypto = require('crypto');

function invokeLambda(arn, payload) {
    let params = {
        ClientContext: aws.util.base64.encode(JSON.stringify({name: 'yt_playlist_dl'})),
        FunctionName: arn,
        Payload: JSON.stringify({ body: JSON.stringify(payload)})
    };
    return new Promise(function (resolve, reject) {
        lambda.invoke(params, (err, response) => {
            if(err) {
                reject(err);
            }
            let responsePayload = JSON.parse(response.Payload);
            if(responsePayload.errorMessage){
                reject(responsePayload.errorMessage);
            }
            resolve(responsePayload);
        });
    });
}

exports.resolve = async function(id, key) {
    key = key || `uploads/${crypto.randomBytes(16).toString('hex')}`;
    return await invokeLambda(process.env.LAMBDA_RESOLVE_ARN, {id, key});
};

exports.convert = async function(source_key, dest_key) {
    dest_key = dest_key || `uploads/${crypto.randomBytes(16).toString('hex')}`;
    return await invokeLambda(process.env.LAMBDA_CONVERT_ARN, {source_key, dest_key});
};
