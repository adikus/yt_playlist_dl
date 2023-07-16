const { getNamespace } = require("cls-hooked");

module.exports = {
    info(...args) {
        console.log(...(args.concat([this.context()])))
    },
    log(...args) {
        this.info(...args)
    },
    error(...args) {
        console.error(...(args.concat([this.context()])))
    },
    context() {
        const applicationNamespace = getNamespace('APP_NAMESPACE');

        const context = {};
        if (applicationNamespace.get('REQUEST_ID')) {
            context.request = {
                id: applicationNamespace.get('REQUEST_ID'),
                path: applicationNamespace.get('REQUEST_PATH')
            }
        }
        if (applicationNamespace.get('USER_ID')) {
            context.user = {
                id: applicationNamespace.get('USER_ID'),
                username: applicationNamespace.get('USER_NAME')
            }
        }

        return JSON.stringify(context);
    }
}
