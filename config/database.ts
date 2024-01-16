import { Sequelize } from 'sequelize';

class Database {
  private static instance: Database;
  private sequelize: Sequelize;

  private constructor() {
    this.sequelize = new Sequelize({
      dialect: 'mysql',
      host: '3306',
      username: 'root@localhost',
      password: 'AvanzataProgram2024?',
      database: 'prova'
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getSequelize(): Sequelize {
    return this.sequelize;
  }
}

export default Database;
