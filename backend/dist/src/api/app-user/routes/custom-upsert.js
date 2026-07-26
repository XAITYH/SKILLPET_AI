"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/app-users/upsert',
            handler: 'app-user.upsert',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};
