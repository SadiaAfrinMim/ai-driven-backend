"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const port = process.env.PORT || 5000;
const server = app_1.default.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
process.on('unhandledRejection', (reason, promise) => {
    console.log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    server.close(() => {
        process.exit(1);
    });
});
process.on('uncaughtException', (error) => {
    console.log(`Uncaught Exception: ${error}`);
    process.exit(1);
});
