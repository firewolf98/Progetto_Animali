import { Sequelize } from 'sequelize';

class Database {
  private static instance: Database;
  private sequelize: Sequelize;

  private constructor() {
    this.sequelize = new Sequelize({
      database: 'nome_del_tuo_database',
      username: 'il_tuo_utente',
      password: 'la_tua_password',
      host: 'localhost', 
      dialect: 'mysql', 
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
