'use strict';

async function ensureColumn(queryInterface, tableName, columnName, definition) {
  const desc = await queryInterface.describeTable(tableName);
  if (!desc[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
}

async function ensureIndex(queryInterface, tableName, indexName, fields, options = {}) {
  const indexes = await queryInterface.showIndex(tableName);
  const exists = indexes.some((idx) => idx.name === indexName);
  if (!exists) {
    await queryInterface.addIndex(tableName, fields, { name: indexName, ...options });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) 服务商申请：补齐审核追踪字段
    await ensureColumn(queryInterface, 'service_provider_applications', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    });
    await ensureColumn(queryInterface, 'service_provider_applications', 'reviewed_by', {
      type: Sequelize.STRING(64),
      allowNull: true
    });
    await ensureColumn(queryInterface, 'service_provider_applications', 'reviewed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await ensureColumn(queryInterface, 'service_provider_applications', 'reject_reason', {
      type: Sequelize.STRING(500),
      allowNull: true
    });

    await ensureIndex(
      queryInterface,
      'service_provider_applications',
      'idx_sp_app_user_status',
      ['user_id', 'status']
    );

    // 2) 服务商门户账号：支持一个服务商档案多个账号（子账号）
    const indexes = await queryInterface.showIndex('service_provider_portal_accounts');
    const profileUniqueIndexes = indexes.filter((idx) => {
      const isUnique = Boolean(idx.unique);
      const hasOnlyProfileId = idx.fields && idx.fields.length === 1 && idx.fields[0].attribute === 'profile_id';
      return isUnique && hasOnlyProfileId;
    });
    for (const idx of profileUniqueIndexes) {
      await queryInterface.removeIndex('service_provider_portal_accounts', idx.name);
    }
    await ensureIndex(
      queryInterface,
      'service_provider_portal_accounts',
      'idx_sp_portal_accounts_profile_id',
      ['profile_id']
    );

    // 3) 服务订单：加唯一单号和高频查询索引
    const serviceOrderDesc = await queryInterface.describeTable('service_orders');
    const orderNoNullable = Boolean(serviceOrderDesc.order_no && serviceOrderDesc.order_no.allowNull);
    if (orderNoNullable) {
      await queryInterface.sequelize.query(
        "UPDATE service_orders SET order_no = CONCAT('SO_MIG_', id) WHERE order_no IS NULL OR order_no = ''"
      );
      await queryInterface.changeColumn('service_orders', 'order_no', {
        type: Sequelize.STRING(32),
        allowNull: false
      });
    }
    await ensureIndex(
      queryInterface,
      'service_orders',
      'uk_service_orders_order_no',
      ['order_no'],
      { unique: true }
    );
    await ensureIndex(
      queryInterface,
      'service_orders',
      'idx_service_orders_provider_status_updated',
      ['provider_user_id', 'status', 'updated_at']
    );
    await ensureIndex(
      queryInterface,
      'service_orders',
      'idx_service_orders_service_status',
      ['service_id', 'status']
    );
  },

  async down(queryInterface, Sequelize) {
    const safeRemoveIndex = async (table, name) => {
      try {
        await queryInterface.removeIndex(table, name);
      } catch (_) {}
    };
    const safeRemoveColumn = async (table, col) => {
      try {
        await queryInterface.removeColumn(table, col);
      } catch (_) {}
    };

    await safeRemoveIndex('service_orders', 'idx_service_orders_service_status');
    await safeRemoveIndex('service_orders', 'idx_service_orders_provider_status_updated');
    await safeRemoveIndex('service_orders', 'uk_service_orders_order_no');

    await safeRemoveIndex('service_provider_portal_accounts', 'idx_sp_portal_accounts_profile_id');
    // 回滚时恢复一档一号约束
    await ensureIndex(
      queryInterface,
      'service_provider_portal_accounts',
      'uk_sp_portal_accounts_profile_id',
      ['profile_id'],
      { unique: true }
    );

    await safeRemoveIndex('service_provider_applications', 'idx_sp_app_user_status');
    await safeRemoveColumn('service_provider_applications', 'reject_reason');
    await safeRemoveColumn('service_provider_applications', 'reviewed_at');
    await safeRemoveColumn('service_provider_applications', 'reviewed_by');

    const desc = await queryInterface.describeTable('service_provider_applications');
    if (desc.updated_at) {
      await safeRemoveColumn('service_provider_applications', 'updated_at');
    }

    // order_no 回滚为可空，避免回滚失败
    try {
      await queryInterface.changeColumn('service_orders', 'order_no', {
        type: Sequelize.STRING(32),
        allowNull: true
      });
    } catch (_) {}
  }
};
