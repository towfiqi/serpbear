import { Table, Model, Column, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'keyword',
})

class Keyword extends Model {
   @PrimaryKey
   @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
   ID!: number;

   @Column({ type: DataType.STRING, allowNull: false })
   keyword!: string;

   @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'desktop' })
   device!: string;

   @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'US' })
   country!: string;

   @Column({ type: DataType.STRING, allowNull: false })
   domain!: string;

   // @ForeignKey(() => Domain)
   // @Column({ allowNull: false })
   // domainID!: number;

   // @BelongsTo(() => Domain)
   // domain!: Domain;

   @Column({ type: DataType.STRING, allowNull: true })
   lastUpdated!: string;

   @Column({ type: DataType.STRING, allowNull: true })
   added!: string;

   @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
   position!: number;

   @Column({ type: DataType.STRING, allowNull: true, defaultValue: JSON.stringify([]) })
   history!: string;

   @Column({ type: DataType.STRING, allowNull: true, defaultValue: JSON.stringify([]) })
   url!: string;

   @Column({ type: DataType.STRING, allowNull: true, defaultValue: JSON.stringify([]) })
   tags!: string;

   @Column({ type: DataType.STRING, allowNull: true, defaultValue: JSON.stringify([]) })
   lastResult!: string;

   @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: true })
   sticky!: boolean;

   @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
   updating!: boolean;

   @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'false' })
   lastUpdateError!: string;
}

export default Keyword;
