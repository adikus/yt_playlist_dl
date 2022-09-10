const handlers = require('./handler');

handlers.resolve({ body: JSON.stringify({ id: process.argv[2], key: process.argv[3] }) }, null, (result) => {
    console.log(result);
});
