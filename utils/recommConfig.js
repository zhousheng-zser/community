/**
 * 邻里帮帮 recomm 页：Tab 配置与表单校验（供小程序与 Node 测试共用）
 */
const SERVICE_TABS = [
  { key: 'take', text: '代取', label: '取', placeholder: '填写取货地址', secondLabel: '收', secondPlaceholder: '填写收货地址' },
  { key: 'child', text: '接送小孩', label: '接', placeholder: '填写接送起点地址', secondLabel: '送', secondPlaceholder: '填写接送终点地址' },
  { key: 'escort', text: '陪诊', label: '起', placeholder: '填写出发/居住地址', secondLabel: '院', secondPlaceholder: '填写医院或就诊地址' },
  { key: 'study', text: '陪读', label: '起', placeholder: '填写陪读出发地址', secondLabel: '达', secondPlaceholder: '填写陪读目的地地址' },
  { key: 'trash', text: '代扔垃圾', label: '上', placeholder: '填写上门取件地址', secondLabel: '投', secondPlaceholder: '填写投放/处理点地址' },
  { key: 'pet', text: '宠物喂养', label: '门', placeholder: '填写上门服务地址', secondLabel: '还', secondPlaceholder: '填写服务结束送回地址' }
];

function getTabByKey(key) {
  const k = key != null ? String(key) : '';
  return SERVICE_TABS.find((t) => t.key === k) || SERVICE_TABS[0];
}

/** @returns {string|null} 若不能提交则返回 Toast 文案，否则 null */
function getSubmitBlockReason(activeTabConfig, currentForm) {
  const form = currentForm || {};
  if (!form.from || !String(form.from).trim()) {
    return (activeTabConfig && activeTabConfig.placeholder) || '请填写第一栏地址';
  }
  if (activeTabConfig && activeTabConfig.secondLabel && (!form.to || !String(form.to).trim())) {
    return activeTabConfig.secondPlaceholder || '请填写第二栏地址';
  }
  return null;
}

module.exports = {
  SERVICE_TABS,
  getTabByKey,
  getSubmitBlockReason
};
