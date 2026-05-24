"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        errorDetails: {
            method: req.method,
            url: req.originalUrl,
        },
    });
};
exports.notFoundHandler = notFoundHandler;
