'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('worker_applications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, comment: '申请人用户ID' },
      name: { type: Sequelize.STRING(50), allowNull: false, comment: '真实姓名' },
      phone: { type: Sequelize.STRING(20), allowNull: false, comment: '联系电话' },
      industry: { type: Sequelize.STRING(50), allowNull: false, comment: '所属行业分类' },
      education: { type: Sequelize.STRING(50), allowNull: true, comment: '学历' },
      city: { type: Sequelize.STRING(50), allowNull: true, comment: '所在城市' },
      resume: { type: Sequelize.TEXT, allowNull: true, comment: '个人简介/简历' },
      id_card_url: { type: Sequelize.STRING(255), allowNull: false, comment: '身份证照片URL' },
      work_photo_url: { type: Sequelize.STRING(255), allowNull: true, comment: '工作照URL' },
      certificate_url: { type: Sequelize.JSON, allowNull: true, comment: '资质证书URL数组' },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        comment: '审核状态'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('worker_applications', ['user_id']);
    await queryInterface.addIndex('worker_applications', ['status']);

    await queryInterface.createTable('service_provider_applications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, comment: '申请人ID' },
      shop_name: { type: Sequelize.STRING(100), allowNull: false, comment: '店铺名称' },
      contact_name: { type: Sequelize.STRING(50), allowNull: false, comment: '联系人有效称呼' },
      phone: { type: Sequelize.STRING(20), allowNull: false, comment: '联系电话' },
      license_url: { type: Sequelize.STRING(255), allowNull: false, comment: '营业执照' },
      shop_front_url: { type: Sequelize.STRING(255), allowNull: true, comment: '门头照片' },
      environment_url: { type: Sequelize.JSON, allowNull: true, comment: '环境照片组' },
      id_card_url: { type: Sequelize.STRING(255), allowNull: false, comment: '法人/代理人身份证' },
      certificate_url: { type: Sequelize.JSON, allowNull: true, comment: '资质证书' },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        comment: '审核状态'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('market_applications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      contact_name: { type: Sequelize.STRING(50), allowNull: false, comment: '联系人' },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      shop_name: { type: Sequelize.STRING(100), allowNull: false, comment: '集市店铺名' },
      category: { type: Sequelize.STRING(50), allowNull: false, comment: '经营品类' },
      address: { type: Sequelize.STRING(255), allowNull: false, comment: '详细地址' },
      description: { type: Sequelize.TEXT, allowNull: true, comment: '简介' },
      promoter_id: { type: Sequelize.INTEGER, allowNull: true, comment: '邀请人/推广员ID' },
      credit_code: { type: Sequelize.STRING(100), allowNull: true, comment: '统一社会信用代码' },
      legal_person: { type: Sequelize.STRING(50), allowNull: true, comment: '法人' },
      place_photo_url: { type: Sequelize.JSON, allowNull: true, comment: '经营场所多图' },
      license_url: { type: Sequelize.STRING(255), allowNull: true, comment: '营业执照多图' },
      community_id: { type: Sequelize.INTEGER, allowNull: true, comment: '所属小区ID' },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('worker_applications');
    await queryInterface.dropTable('service_provider_applications');
    await queryInterface.dropTable('market_applications');
  }
};
