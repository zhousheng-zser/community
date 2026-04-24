'use strict';

/** 设计手册：技工小区/上架服务、到家订单扩展、评价与投诉、管家精选 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const addCol = async (table, column, spec) => {
      try {
        await queryInterface.addColumn(table, column, spec);
      } catch (e) {
        if (!String(e.message).includes('Duplicate')) console.warn(`skip add ${table}.${column}:`, e.message);
      }
    };

    await addCol('worker_profiles', 'community_id', { type: Sequelize.INTEGER, allowNull: true });
    await addCol('worker_profiles', 'gender', { type: Sequelize.STRING(8), allowNull: true });
    await addCol('worker_profiles', 'main_direction', { type: Sequelize.STRING(120), allowNull: true });

    await addCol('service_orders', 'order_no', { type: Sequelize.STRING(32), allowNull: true });
    await addCol('service_orders', 'contact_name', { type: Sequelize.STRING(64), allowNull: true });
    await addCol('service_orders', 'contact_phone', { type: Sequelize.STRING(20), allowNull: true });
    await addCol('service_orders', 'goods_name', { type: Sequelize.STRING(200), allowNull: true });
    await addCol('service_orders', 'qty', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 });
    await addCol('service_orders', 'provider_user_id', { type: Sequelize.INTEGER, allowNull: true });

    await queryInterface.addIndex('service_orders', ['order_no'], { unique: true, name: 'uk_service_orders_order_no' }).catch(() => {});

    await queryInterface.createTable('worker_services', {
      id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      worker_user_id: { type: Sequelize.INTEGER, allowNull: false },
      service_id: { type: Sequelize.INTEGER, allowNull: false },
      enabled: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 1 },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    }).catch((e) => {
      if (!String(e.message).includes('already exists')) throw e;
    });
    await queryInterface.addIndex('worker_services', ['worker_user_id', 'service_id'], {
      unique: true,
      name: 'uk_worker_services_worker_svc'
    }).catch(() => {});

    await queryInterface.createTable('service_order_reviews', {
      id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      order_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      worker_id: { type: Sequelize.INTEGER, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      score: { type: Sequelize.TINYINT, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    }).catch((e) => {
      if (!String(e.message).includes('already exists')) throw e;
    });
    await queryInterface.addIndex('service_order_reviews', ['worker_id', 'created_at'], { name: 'idx_sor_worker_ctime' }).catch(() => {});

    await queryInterface.createTable('service_order_complaints', {
      id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      order_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      images_json: { type: Sequelize.JSON, allowNull: true },
      status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'open' },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    }).catch((e) => {
      if (!String(e.message).includes('already exists')) throw e;
    });
    await queryInterface.addIndex('service_order_complaints', ['order_id'], { name: 'idx_soc_order' }).catch(() => {});

    await queryInterface.createTable('community_featured_goods', {
      id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      community_id: { type: Sequelize.INTEGER, allowNull: false },
      market_good_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 1 },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    }).catch((e) => {
      if (!String(e.message).includes('already exists')) throw e;
    });
    await queryInterface.addIndex('community_featured_goods', ['community_id', 'sort_order'], {
      name: 'idx_cfg_comm_sort'
    }).catch(() => {});
    await queryInterface.addIndex('community_featured_goods', ['community_id', 'market_good_id'], {
      unique: true,
      name: 'uk_cfg_comm_good'
    }).catch(() => {});
  },

  async down(queryInterface) {
    await queryInterface.dropTable('community_featured_goods').catch(() => {});
    await queryInterface.dropTable('service_order_complaints').catch(() => {});
    await queryInterface.dropTable('service_order_reviews').catch(() => {});
    await queryInterface.dropTable('worker_services').catch(() => {});
    for (const [t, c] of [
      ['service_orders', 'provider_user_id'],
      ['service_orders', 'qty'],
      ['service_orders', 'goods_name'],
      ['service_orders', 'contact_phone'],
      ['service_orders', 'contact_name'],
      ['service_orders', 'order_no'],
      ['worker_profiles', 'main_direction'],
      ['worker_profiles', 'gender'],
      ['worker_profiles', 'community_id']
    ]) {
      try {
        await queryInterface.removeColumn(t, c);
      } catch (e) { /* ignore */ }
    }
  }
};
