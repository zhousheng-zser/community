const { sequelize } = require('./database');
const defineJdBenefitGood = require('./JdBenefitGood');

const JdBenefitGood = defineJdBenefitGood(sequelize);

module.exports = {
  sequelize,
  JdBenefitGood
};
