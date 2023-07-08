const request = require('request-promise');

const yt_api = 'https://www.googleapis.com/youtube/v3';

exports.search = async function(token, qs) {
    const response = await request({
        url: yt_api + '/videos',
        qs: qs,
        auth: {
            bearer: token
        },
        json: true
    })
    return response.items;
};
