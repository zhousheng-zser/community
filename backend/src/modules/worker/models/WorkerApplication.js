'use strict';

module.exports = (sequelize, DataTypes) => {
  const WorkerApplication = sequelize.define('WorkerApplication', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '申请人用户ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ''
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    education: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    city: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: ''
    },
    resume: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    id_card_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    work_photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    certificate_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('certificate_url');
        try {
          return JSON.parse(raw);
        } catch (e) {
          return raw ? [raw] : [];
        }
      },
      set(val) {
        if (Array.isArray(val)) {
          this.setDataValue('certificate_url', JSON.stringify(val));
        } else {
          this.setDataValue('certificate_url', val || '[]');
        }
      }
    },
    services: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('services');
        try {
          return JSON.parse(raw);
        } catch (e) {
          return [];
        }
      },
      set(val) {
        if (Array.isArray(val)) {
          this.setDataValue('services', JSON.stringify(val));
        } else {
          this.setDataValue('services', val || '[]');
        }
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'pending/approved/rejected'
    },
    reject_reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    reviewed_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '审核人ID'
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'worker_applications',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // 须与 src/models/index.js 加载顺序一致：本文件会覆盖同名主模型，若不声明 associate，
  // Admin GET /admin/worker-applications 里 include User 会报「未关联」导致 500。
  WorkerApplication.associate = (models) => {
    if (models.User) {
      WorkerApplication.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  };

  return WorkerApplication;
};
