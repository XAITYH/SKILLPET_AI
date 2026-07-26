"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = ({ env, }) => ({
    host: env("HOST", "0.0.0.0"),
    port: env.int("PORT", 1337),
    url: env("PUBLIC_URL", "http://localhost:1337"),
    app: {
        keys: env.array("APP_KEYS"),
    },
    mcp: {
        enabled: true,
        connectTimeoutMs: 10000,
        requestTimeoutMs: 120000,
    },
    webhooks: {
        populateRelations: env.bool("WEBHOOKS_POPULATE_RELATIONS", false),
    },
});
exports.default = config;
