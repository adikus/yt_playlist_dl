const handlers = require('./handler');

handlers.convert({ source_key: process.argv[2], dest_key: process.argv[3] }, null, (result) => {
    console.log(result);
});
