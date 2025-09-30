
module.exports = {
  apps: [{
    name: 'premier-erp',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    restart_delay: 1000,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
