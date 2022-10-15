const repl = require("repl");

const orm = require("orm");

const { define: defineDB } = require('./server/database');

require('dotenv').config();

orm.connect(process.env.DATABASE_URL, async (err, db) => {
    if (err) {
        console.error(err);
        process.exit()
    }

    const app = { models: {} };
    defineDB(app, db, app.models);
    app.s3Bucket = new require('./server/services/s3_bucket')('yt-playlist');

    const replServer = repl.start({
        prompt: "dev> ",
    });

    replServer.context.app = app;
    replServer.context.s3Bucket = app.s3Bucket;
    replServer.context.db = app.db;
    replServer.context.models = app.models;

    Object.entries(app.models).forEach(([key, _value]) => {
        let modelName = key.replace(/(\_\w)/g, (k) => k[1].toUpperCase());
        modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
        replServer.context[modelName] = require(`./server/models/${key}`)
    });
});
