// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('./dist/src/config').default;

module.exports = {
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.pass,
  database: config.database.dbName,
  entities: ['dist/src/modules/**/entities/*.entity.js'],
  synchronize: true,
  migrationsTableName: 'migrations',
  migrations: ['dist/database/migration/*.js'],
  cli: {
    migrationsDir: 'database/migration',
  },
};
