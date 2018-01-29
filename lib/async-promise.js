const async = require('async');

module.exports = {
    eachLimit: function(items, limit, iteratee) {
        return new Promise((resolve, reject) => {
            async.eachLimit(items, limit, iteratee, (err) => {
                if(err) return reject(err);
                resolve()
            });
        });
    }
};