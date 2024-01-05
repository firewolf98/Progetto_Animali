import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Alimento extends Model {
  public id!: number;
  public nome!: string;
  public quantita!: number;
  public quantita_disponibile!: number;
  public created_at!: Date;
  public updated_at!: Date;
  public quantita_caricata!: number;
}

Alimento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantita: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantita_disponibile: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    quantita_caricata: { 
      type: DataTypes.INTEGER,
      allowNull: true, 
    },
  },
  {
    tableName: 'Alimenti',
    sequelize,
  }
);

export default Alimento;
