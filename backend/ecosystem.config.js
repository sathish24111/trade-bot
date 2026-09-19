module.exports = {
  apps: [
    {
      name: 'tradepilot-backend',
      script: 'dist/server.js',
      cwd: 'd:/Mob-trade/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 2000,
      env: {
        NODE_ENV: 'paper-production',
        PORT: 5000,
        TRADING_MODE: 'PAPER'
      }
    }
  ]
};
