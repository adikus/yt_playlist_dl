const fs = require('fs');
const path = require("path");

const manifestFile = path.join(__dirname, '../dist/manifest.json');
let manifest = null;
if (process.env.NODE_ENV === "production" && fs.existsSync(manifestFile)) {
    manifest = JSON.parse(fs.readFileSync(manifestFile).toString());
}

if (manifest) {
    module.exports = {
        scripts: [manifest['frontend/main.js']['file']],
        stylesheets: manifest['frontend/main.js']['css']
    }
} else {
    module.exports = null;
}
