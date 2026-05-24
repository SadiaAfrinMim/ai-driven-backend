import 'dotenv/config';
import app from './app';

// Export for Vercel serverless
export default app;

// Only start local server when NOT on Vercel
if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (error) => {
    console.log(`Uncaught Exception: ${error}`);
    process.exit(1);
  });
}
