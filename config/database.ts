import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'your-mysql-host',
  username: 'your-mysql-username',
  password: 'your-mysql-password',
  database: 'your-mysql-database',
});

export default sequelize;
