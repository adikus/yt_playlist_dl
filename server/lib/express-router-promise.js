const { asyncContext } = require('./../context');

module.exports = {
    wrap: function(genFn) {
        return function (req, res, next) {
            asyncContext(req, async () => {
                try {
                    await genFn(req, res, next);
                } catch (err) {
                    next(err)
                }
            });
        }
    }
};