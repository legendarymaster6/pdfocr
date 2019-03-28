module.exports = {
  apps : [{
    name: 'pdfocr',
    script: './server.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    autorestart: true,
    watch: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],
};
