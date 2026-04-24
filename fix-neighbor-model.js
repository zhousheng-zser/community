const { Client } = require('ssh2');

const NEW_MODEL = `'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NeighborAssistOrder extends Model {
    static associate(models) {
      NeighborAssistOrder.belongsTo(models.User, { foreignKey: 'user_id', as: 'publisher' });
      NeighborAssistOrder.belongsTo(models.User, { foreignKey: 'user_id', as: 'buyer' });
      NeighborAssistOrder.belongsTo(models.User, { foreignKey: 'assigned_worker_id', as: 'assignedWorker' });
    }
  }

  NeighborAssistOrder.init({
    assist_type: { type: DataTypes.STRING(32), allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    community_id: { type: DataTypes.INTEGER, allowNull: true },
    origin_address_snapshot: { type: DataTypes.JSON, allowNull: false },
    destination_address_snapshot: { type: DataTypes.JSON, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    appointment_time: { type: DataTypes.DATE, allowNull: true },
    remark: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending_pay' },
    pay_status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'unpaid' },
    assigned_worker_id: { type: DataTypes.INTEGER, allowNull: true },
    dispatch_at: { type: DataTypes.DATE, allowNull: true },
    dispatch_by: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    sequelize,
    modelName: 'NeighborAssistOrder',
    tableName: 'neighbor_assist_orders',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return NeighborAssistOrder;
};
`;

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  const cmd = `cat > /home/cw/a/community-backend/backend/src/models/NeighborAssistOrder.js << 'MODELEOF'\n${NEW_MODEL}\nMODELEOF`;
  conn.exec(cmd, (err, stream) => {
    if (err) return console.error('SSH exec error:', err);
    stream.on('close', (code) => {
      console.log('File written, exit code:', code);
      // Verify
      conn.exec(`cat /home/cw/a/community-backend/backend/src/models/NeighborAssistOrder.js`, (err2, stream2) => {
        if (err2) return console.error('Verify error:', err2);
        let out = '';
        stream2.on('data', d => out += d.toString());
        stream2.on('end', () => {
          console.log('\nVerified file:');
          console.log(out);
          conn.end();
          process.exit(0);
        });
      });
    });
    stream.stderr.on('data', d => console.error('STDERR:', d.toString()));
  });
}).on('error', err => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({ host: '192.168.110.50', username: 'cw', readyTimeout: 10000 });
