'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const addCol = async (table, column, spec) => {
      try {
        await queryInterface.addColumn(table, column, spec);
      } catch (e) {
        if (!String(e.message).includes('Duplicate')) console.warn(`skip add ${table}.${column}:`, e.message);
      }
    };

    await addCol('Banners', 'link_type', { type: Sequelize.STRING(32), allowNull: true, defaultValue: 'none' });
    await addCol('Banners', 'link_value', { type: Sequelize.STRING(512), allowNull: true });
    await addCol('Banners', 'scene', { type: Sequelize.STRING(32), allowNull: true, defaultValue: 'home' });

    await addCol('Services', 'is_published', { type: Sequelize.TINYINT, allowNull: false, defaultValue: 1 });
    await addCol('Services', 'detail_images', { type: Sequelize.JSON, allowNull: true });
    await addCol('Services', 'tags', { type: Sequelize.JSON, allowNull: true });
    await addCol('Services', 'sub_title', { type: Sequelize.STRING(200), allowNull: true });
    await addCol('Services', 'provider_id', { type: Sequelize.INTEGER, allowNull: true });
    await addCol('Services', 'order_count', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });

    await addCol('Goods', 'is_featured', { type: Sequelize.TINYINT, allowNull: false, defaultValue: 0 });
    await addCol('Goods', 'featured_sort', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
    await addCol('Goods', 'unit', { type: Sequelize.STRING(20), allowNull: true });

    await addCol('Users', 'community_id', { type: Sequelize.INTEGER, allowNull: true });

    await addCol('market_orders', 'community_id', { type: Sequelize.BIGINT, allowNull: true });

    await queryInterface.createTable('service_orders', {
      id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      community_id: { type: Sequelize.INTEGER, allowNull: true },
      service_id: { type: Sequelize.INTEGER, allowNull: false },
      group_key: { type: Sequelize.STRING(32), allowNull: true },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      address_id: { type: Sequelize.INTEGER, allowNull: true },
      address_snapshot: { type: Sequelize.JSON, allowNull: true },
      appointment_time: { type: Sequelize.DATE, allowNull: true },
      remark: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'pending_pay' },
      pay_status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'unpaid' },
      assigned_worker_id: { type: Sequelize.INTEGER, allowNull: true },
      dispatch_at: { type: Sequelize.DATE, allowNull: true },
      dispatch_by: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    }).catch((e) => {
      if (!String(e.message).includes('already exists')) throw e;
    });

    await queryInterface.addIndex('service_orders', ['user_id', 'created_at'], { name: 'idx_so_user_ctime' }).catch(() => {});
    await queryInterface.addIndex('service_orders', ['status', 'created_at'], { name: 'idx_so_status_ctime' }).catch(() => {});
    await queryInterface.addIndex('service_orders', ['community_id', 'status', 'created_at'], { name: 'idx_so_comm_status' }).catch(() => {});
    await queryInterface.addIndex('service_orders', ['assigned_worker_id'], { name: 'idx_so_worker' }).catch(() => {});

    await queryInterface.createTable('neighbor_assist_orders', {
      id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      assist_type: { type: Sequelize.STRING(32), allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      community_id: { type: Sequelize.INTEGER, allowNull: true },
      origin_address_snapshot: { type: Sequelize.JSON, allowNull: false },
      destination_address_snapshot: { type: Sequelize.JSON, allowNull: false },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      appointment_time: { type: Sequelize.DATE, allowNull: true },
      remark: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'pending_pay' },
      pay_status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'unpaid' },
      assigned_worker_id: { type: Sequelize.INTEGER, allowNull: true },
      dispatch_at: { type: Sequelize.DATE, allowNull: true },
      dispatch_by: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    }).catch((e) => {
      if (!String(e.message).includes('already exists')) throw e;
    });

    await queryInterface.addIndex('neighbor_assist_orders', ['user_id', 'created_at'], { name: 'idx_nao_user_ctime' }).catch(() => {});
    await queryInterface.addIndex('neighbor_assist_orders', ['community_id', 'status'], { name: 'idx_nao_comm_status' }).catch(() => {});
    await queryInterface.addIndex('neighbor_assist_orders', ['assist_type', 'status'], { name: 'idx_nao_type_status' }).catch(() => {});
  },

  async down(queryInterface) {
    await queryInterface.dropTable('neighbor_assist_orders').catch(() => {});
    await queryInterface.dropTable('service_orders').catch(() => {});
    for (const [table, col] of [
      ['market_orders', 'community_id'],
      ['Users', 'community_id'],
      ['Goods', 'unit'],
      ['Goods', 'featured_sort'],
      ['Goods', 'is_featured'],
      ['Services', 'order_count'],
      ['Services', 'provider_id'],
      ['Services', 'sub_title'],
      ['Services', 'tags'],
      ['Services', 'detail_images'],
      ['Services', 'is_published'],
      ['Banners', 'scene'],
      ['Banners', 'link_value'],
      ['Banners', 'link_type']
    ]) {
      try {
        await queryInterface.removeColumn(table, col);
      } catch (e) { /* ignore */ }
    }
  }
};
