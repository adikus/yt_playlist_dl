const express = require("express");
const router = express.Router();


const assetsRedirect = (req, res) => {
    res.redirect(303, `http://localhost:5173${req.baseUrl}${req.path}`);
}

router.get("/frontend/*", assetsRedirect);
router.get("/node_modules/*", assetsRedirect);
router.get("/@vite/*", assetsRedirect);

module.exports = router;
