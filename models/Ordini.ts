import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Ordine extends Model {
  public id!: number;
  public stato!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Ordine.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    stato: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'CREATO',
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
  },
  {
    tableName: 'Ordini',
    sequelize,
  }
);

export default Ordine;
