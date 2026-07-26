"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const allowedMediaTypes = [
    "image/*",
    "video/*",
    "audio/*",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.*",
    "text/plain",
    "text/csv",
];
const deniedExecutableTypes = [
    "application/vnd.microsoft.portable-executable",
    "application/x-msdownload",
    "application/x-msdos-program",
    "application/x-executable",
    "application/x-dosexec",
    "application/x-sh",
    "text/x-shellscript",
    "application/x-mach-binary",
];
const config = ({ env, }) => ({
    "users-permissions": {
        config: {
            jwtManagement: "default",
        },
    },
    upload: {
        config: {
            provider: "cloudinary",
            providerOptions: {
                cloud_name: env("CLOUDINARY_NAME"),
                api_key: env("CLOUDINARY_KEY"),
                api_secret: env("CLOUDINARY_SECRET"),
            },
            actionOptions: {
                upload: {},
                delete: {},
            },
        },
    },
});
exports.default = config;
