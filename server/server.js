require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./socket/index");
const env = require("./config/env");

// Start server
const startServer = async () => {
  await connectDB();

  // Start Bull queues (they connect to Redis lazily)
  require("./queues/emailQueue");
  require("./queues/notificationQueue");

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    console.log(`🚀 SkillSwap AI server running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`📍 Health: http://localhost:${env.PORT}/health`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
