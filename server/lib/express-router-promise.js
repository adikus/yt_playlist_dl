module.exports = {
    wrap: function(genFn) {
        return function (req, res, next) {
            genFn(req, res, next).catch(next);
        }
    }
};