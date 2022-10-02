const express = require("express");
const router = express.Router();


const assetsRedirect = (req, res) => {
    res.redirect(303, `http://localhost:${process.env.ASSETS_PORT}${req.baseUrl}${req.path}`);
}

if (process.env.NODE_ENV !== "production") {
    router.get("/frontend/*", assetsRedirect);
    router.get("/node_modules/*", assetsRedirect);
    router.get("/@vite/*", assetsRedirect);
}

module.exports = router;
