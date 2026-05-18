"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse = (res, statusCode, success, message, data, meta) => {
    const response = {
        success,
        message,
        ...(data && { data }),
        ...(meta && { meta }),
    };
    res.status(statusCode).json(response);
};
exports.default = sendResponse;
