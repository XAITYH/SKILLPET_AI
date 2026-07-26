"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::app-user.app-user', ({ strapi }) => ({
    async upsert(ctx) {
        const { email, displayName, avatarUrl, insforgeUserId } = ctx.request.body;
        if (!email) {
            return ctx.badRequest('email is required');
        }
        const existing = await strapi.documents('api::app-user.app-user').findFirst({
            filters: { email },
        });
        const data = {
            lastAuthenticatedAt: new Date().toISOString(),
            displayName: displayName || email.split('@')[0],
        };
        if (avatarUrl)
            data.avatarUrl = avatarUrl;
        if (insforgeUserId)
            data.insforgeUserId = insforgeUserId;
        let result;
        if (existing) {
            result = await strapi.documents('api::app-user.app-user').update({
                documentId: existing.documentId,
                data,
            });
        }
        else {
            result = await strapi.documents('api::app-user.app-user').create({
                data: {
                    emailVerified: true,
                    ...data,
                    email,
                    publishedAt: new Date().toISOString(),
                },
            });
        }
        return ctx.send(result);
    },
}));
