import { Table, Model, Column, DataType, PrimaryKey, Unique } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'domain',
})

class Domain extends Model {
   @PrimaryKey
   @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
   ID!: number;

   @Unique
   @Column({ type: DataType.STRING, allowNull: false, defaultValue: true, unique: true })
   domain!: string;

   @Unique
   @Column({ type: DataType.STRING, allowNull: false, defaultValue: true, unique: true })
   slug!: string;

   @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
   keywordCount!: number;

   @Column({ type: DataType.STRING, allowNull: true })
   lastUpdated!: string;

   @Column({ type: DataType.STRING, allowNull: true })
   added!: string;

   @Column({ type: DataType.STRING, allowNull: true, defaultValue: JSON.stringify([]) })
   tags!: string;

   @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: true })
   notification!: boolean;

   @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'daily' })
   notification_interval!: string;

   @Column({ type: DataType.STRING, allowNull: true, defaultValue: '' })
   notification_emails!: string;
}

export default Domain;
