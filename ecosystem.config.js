module.exports = {
  apps: [
    {
      name: 'analise-frontend-prod',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/analise-frontend/prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'analise-frontend-dev',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/analise-frontend/dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};