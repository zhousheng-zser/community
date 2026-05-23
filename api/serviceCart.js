/**
 * 直约服务商购物车 API
 */
const { get, post, put, del } = require('../utils/util.js');

const getCartSummary = () => get('/service-cart/summary');

const getCart = (providerId) => get('/service-cart', providerId ? { provider_id: providerId } : null);

const addToCart = (data) => post('/service-cart/items', data);

const updateCartItem = (itemId, data) => put(`/service-cart/items/${itemId}`, data);

const deleteCartItem = (itemId) => del(`/service-cart/items/${itemId}`);

const clearCart = (providerId) => del('/service-cart', providerId ? { provider_id: providerId } : null);

module.exports = {
  getCartSummary,
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart
};
