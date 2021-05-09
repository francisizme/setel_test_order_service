module.exports = {
  apps: [
    {
      name: 'order_endpoint',
      script: './dist/src/main.js',
      instances: 1,
      exec_mode: 'cluster',
      max_memory_restart: '400M',
    },
    {
      name: 'order_service',
      script: './dist/src/listener.js',
      instances: 1,
      exec_mode: 'cluster',
      max_memory_restart: '400M',
    },
  ],
};
