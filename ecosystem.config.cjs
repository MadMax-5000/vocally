module.exports = {
  apps: [
    {
      name: "vocally-blue",
      script: "server/index.ts",
      interpreter: "tsx",
      cwd: "/var/www/blue",
      env: { PORT: 3001, NODE_ENV: "production" },
      max_memory_restart: "1G",
      stop_exit_codes: [0],
    },
    {
      name: "vocally-green",
      script: "server/index.ts",
      interpreter: "tsx",
      cwd: "/var/www/green",
      env: { PORT: 3002, NODE_ENV: "production" },
      max_memory_restart: "1G",
      stop_exit_codes: [0],
    },
  ],
};
