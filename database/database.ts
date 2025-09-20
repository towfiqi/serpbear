import { Sequelize } from 'sequelize-typescript';
import sqliteDialect from './sqlite-dialect';
import Domain from './models/domain';
import Keyword from './models/keyword';

const connection = new Sequelize({
   dialect: 'sqlite',
   host: '0.0.0.0',
   username: process.env.USER_NAME ? process.env.USER_NAME : process.env.USER,
   password: process.env.PASSWORD,
   database: 'sequelize',
   dialectModule: sqliteDialect,
   pool: {
      max: 5,
      min: 0,
      idle: 10000,
   },
   logging: false,
   models: [Domain, Keyword],
   storage: './data/database.sqlite',
});

export default connection;
