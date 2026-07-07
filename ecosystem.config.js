module.exports = {
  apps: [
    {
      name: 'gemai-web',
      cwd: '/home/ubuntu/dm-automation',
      script: 'npm',
      args: 'run start --workspace @repo/web',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/web-err.log',
      out_file: './logs/web-out.log',
      time: true,
    },
    {
      name: 'gemai-api',
      cwd: '/home/ubuntu/dm-automation',
      script: 'npm',
      args: 'run start --workspace @repo/api',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: './logs/api-err.log',
      out_file: './logs/api-out.log',
      time: true,
    },
  ],
};
