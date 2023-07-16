const path = require("path");
const http = require('http');

const express = require("express");
const bodyParser = require('body-parser');
const session = require('express-session');
const morgan = require('morgan');

const { setupContext } = require('./server/context');
const logger = require('./server/logger')

const { PORT = 3000 } = process.env;

require('dotenv').config();


const app = express();

app.set('env', 'development');
app.set('port', PORT);
app.set('views', path.join(__dirname, 'server/views'));
app.set('view engine', 'pug');

app.use(setupContext())
app.use(morgan((tokens, req, res) => {
    const message = morgan.dev(tokens, req, res);
    logger.log(message);
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('cookie-parser')());
app.use(require('express-fileupload')());
const sessionStore = new (require('connect-pg-simple')(session))();
app.use(session({ store: sessionStore, secret: 'verysecretsessionkey', saveUninitialized: false, resave: false, rolling: true }));
app.use(require('express-flash')());

app.use("/", express.static(path.join(__dirname, "public")));
if (process.env.NODE_ENV === "production") {
    app.use("/", express.static(path.join(__dirname, "dist")));
}

const { setupPassport } = require('./server/passport');
const { setupOrm } = require('./server/database');
const S3Bucket = require('./server/services/s3_bucket');

setupPassport(app);
setupOrm(app);
app.s3Bucket = new S3Bucket('yt-playlist');

const router = require("./server/router.js");
app.use(router);

let server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`\n  App running on port ${PORT}\n`);
    console.log(`  > Local: \x1b[36mhttp://localhost:\x1b[1m${PORT}/\x1b[0m`);
});
