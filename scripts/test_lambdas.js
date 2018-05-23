const aws = require('aws-sdk');
const lambda = new aws.Lambda({region: 'eu-central-1'});
require('dotenv').config();

let params = {
    ClientContext: aws.util.base64.encode(JSON.stringify({name: 'yt_playlist_dl'})),
    FunctionName: process.env.LAMBDA_RESOLVE_ARN,
    Payload: JSON.stringify({ body: JSON.stringify({id: process.argv[2], key: process.argv[3] })})
};

let params2 = {
    ClientContext: aws.util.base64.encode(JSON.stringify({name: 'yt_playlist_dl'})),
    FunctionName: process.env.LAMBDA_CONVERT_ARN,
    Payload: JSON.stringify({ body: JSON.stringify({source_key: process.argv[3], dest_key: process.argv[4] })})
};

lambda.invoke(params, (err, response) => {
    lambda.invoke(params2, (err, response) => {
        console.log(err, response);
    });
    console.log(err, response);
});
