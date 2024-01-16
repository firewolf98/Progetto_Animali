import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Alimento from './Alimenti'; 


class Operazione extends Model {
  public id!: number;
  public tipologia!: string;
  public quantita!: number;
  public timestamp!: Date;

  // Associa l'operazione a un alimento
  public alimento_id!: number;
}

Operazione.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tipologia: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantita: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'Operazioni',
    sequelize,
  }
);

// Definisci le relazioni con altri modelli, ad esempio Alimento
Operazione.belongsTo(Alimento, { foreignKey: 'alimento_id', as: 'alimento' });

// Esporta il modello Operazione
export default Operazione;
