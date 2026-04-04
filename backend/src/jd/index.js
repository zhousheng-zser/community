const { sequelize } = require('./database');
const defineJdBenefitGood = require('./JdBenefitGood');
const definePddBenefitGood = require('./PddBenefitGood');
const defineBenefitAllianceConfig = require('./BenefitAllianceConfig');

const JdBenefitGood = defineJdBenefitGood(sequelize);
const PddBenefitGood = definePddBenefitGood(sequelize);
const BenefitAllianceConfig = defineBenefitAllianceConfig(sequelize);

module.exports = {
  sequelize,
  JdBenefitGood,
  PddBenefitGood,
  BenefitAllianceConfig
};
