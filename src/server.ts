import 'dotenv/config';
import app from './app';
import { Server } from 'http';

const port = process.env.PORT || 5000;

const server: Server = app.listen(port, () => {
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