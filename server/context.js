const { createNamespace } = require("cls-hooked");
const uuid = require("uuid");

const applicationNamespace = createNamespace('APP_NAMESPACE');

module.exports = {
    setupContext() {
        return (req, res, next) => {
            applicationNamespace.run(() => {
                req.id = uuid.v4();

                next()
            });
        };
    },
    asyncContext(req, promise) {
        applicationNamespace.runPromise(async () => {
            applicationNamespace.set('REQUEST_ID', req.id);
            applicationNamespace.set('REQUEST_PATH', req.originalUrl);

            await promise();
        })
    }
}