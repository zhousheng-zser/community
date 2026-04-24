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

    await queryInterface.createTable('market_good_skus', {
      id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      goods_id: { type: Sequelize.INTEGER, allowNull: false },
      sku_code: { type: Sequelize.STRING(64), allowNull: true },
      specs: { type: Sequelize.JSON, allowNull: false, comment: '规格维度数组，如 ["大份","偏甜"]' },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      image: { type: Sequelize.STRING(512), allowNull: true },
      status: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
    try {
      await queryInterface.addIndex('market_good_skus', ['goods_id'], { name: 'idx_market_good_skus_goods_id' });
    } catch (e) {
      if (!String(e.message).includes('Duplicate')) throw e;
    }

    await addCol('market_goods', 'price_range', { type: Sequelize.STRING(64), allowNull: true });
    await addCol('market_goods', 'desc_html', { type: Sequelize.TEXT, allowNull: true });

    await addCol('market_order_items', 'market_sku_id', { type: Sequelize.BIGINT.UNSIGNED, allowNull: true });
    await addCol('market_order_items', 'specs_snapshot', { type: Sequelize.JSON, allowNull: true });

    await addCol('market_orders', 'delivery_mode', {
      type: Sequelize.STRING(16),
      allowNull: false,
      defaultValue: 'express',
      comment: 'express 到家 / pickup 自提'
    });

    await addCol('market_applications', 'logo_url', { type: Sequelize.STRING(512), allowNull: true });
    await addCol('market_applications', 'background_url', { type: Sequelize.STRING(512), allowNull: true });
    await addCol('market_applications', 'entity_name', { type: Sequelize.STRING(200), allowNull: true, comment: '主体名称' });
    await addCol('market_applications', 'promoter_name', { type: Sequelize.STRING(100), allowNull: true, comment: '推广员（选填）' });

    await queryInterface.sequelize.query(`
      INSERT INTO market_good_skus (goods_id, specs, price, stock, status, created_at, updated_at)
      SELECT g.id, CAST('[]' AS JSON), g.price, g.stock, 'active', NOW(), NOW()
      FROM market_goods g
      WHERE NOT EXISTS (SELECT 1 FROM market_good_skus s WHERE s.goods_id = g.id)
    `);

    await queryInterface.sequelize.query(`
      UPDATE market_goods g
      INNER JOIN (
        SELECT goods_id, MIN(price) AS min_p, MAX(price) AS max_p
        FROM market_good_skus
        GROUP BY goods_id
      ) x ON x.goods_id = g.id
      SET g.price_range = CASE
        WHEN x.min_p = x.max_p THEN CAST(x.min_p AS CHAR)
        ELSE CONCAT(CAST(x.min_p AS CHAR), '-', CAST(x.max_p AS CHAR))
      END
    `);

    await queryInterface.changeColumn('market_orders', 'order_status', {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'pending_payment'
    });

    await queryInterface.sequelize.query(`
      UPDATE market_orders SET order_status = 'pending_accept' WHERE order_status = 'paid'
    `);
    await queryInterface.sequelize.query(`
      UPDATE market_orders SET order_status = 'pending_service' WHERE order_status = 'delivering'
    `);
    await queryInterface.sequelize.query(`
      UPDATE market_orders SET order_status = 'cancelled' WHERE order_status = 'closed'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('market_applications', 'promoter_name').catch(() => {});
    await queryInterface.removeColumn('market_applications', 'entity_name').catch(() => {});
    await queryInterface.removeColumn('market_applications', 'background_url').catch(() => {});
    await queryInterface.removeColumn('market_applications', 'logo_url').catch(() => {});

    await queryInterface.removeColumn('market_orders', 'delivery_mode').catch(() => {});

    await queryInterface.sequelize.query(`
      UPDATE market_orders SET order_status = 'paid' WHERE order_status = 'pending_accept'
    `).catch(() => {});
    await queryInterface.sequelize.query(`
      UPDATE market_orders SET order_status = 'delivering' WHERE order_status IN ('pending_service','pending_receipt')
    `).catch(() => {});

    await queryInterface.changeColumn('market_orders', 'order_status', {
      type: Sequelize.ENUM('pending_payment', 'paid', 'delivering', 'completed', 'cancelled', 'closed'),
      allowNull: false,
      defaultValue: 'pending_payment'
    }).catch(() => {});

    await queryInterface.removeColumn('market_order_items', 'specs_snapshot').catch(() => {});
    await queryInterface.removeColumn('market_order_items', 'market_sku_id').catch(() => {});

    await queryInterface.removeColumn('market_goods', 'desc_html').catch(() => {});
    await queryInterface.removeColumn('market_goods', 'price_range').catch(() => {});

    await queryInterface.dropTable('market_good_skus').catch(() => {});
  }
};
