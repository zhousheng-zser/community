'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const banners = [
      {
        image_url: 'https://via.placeholder.com/600x300/ff7f50/ffffff?text=Community+Banner+1',
        target_url: '/pages/detail/index?id=1',
        sort_order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        image_url: 'https://via.placeholder.com/600x300/6495ed/ffffff?text=Community+Banner+2',
        target_url: '/pages/detail/index?id=2',
        sort_order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const categories = [
      {
        id: 1,
        name: '家政服务',
        icon_url: 'https://via.placeholder.com/100?text=Clean',
        sort_order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: '维修服务',
        icon_url: 'https://via.placeholder.com/100?text=Repair',
        sort_order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: '二手交易',
        icon_url: 'https://via.placeholder.com/100?text=SecondHand',
        sort_order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const services = [
      {
        category_id: 1,
        title: '日常保洁 3小时',
        description: '专业的日常保洁服务，让您的家焕然一新。',
        price: 150.00,
        cover_image: 'https://via.placeholder.com/300?text=Cleaning+Service',
        sales_count: 120,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category_id: 2,
        title: '家电维修检测',
        description: '师傅上门检测，迅速定位家电故障。',
        price: 50.00,
        cover_image: 'https://via.placeholder.com/300?text=Repair+Service',
        sales_count: 85,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category_id: 3,
        title: '九成新自行车',
        description: '闲置公路车一台，可小刀。',
        price: 300.00,
        cover_image: 'https://via.placeholder.com/300?text=Bike',
        sales_count: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Banners', banners, {});
    await queryInterface.bulkInsert('Categories', categories, {});
    await queryInterface.bulkInsert('Services', services, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Banners', null, {});
    await queryInterface.bulkDelete('Services', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
