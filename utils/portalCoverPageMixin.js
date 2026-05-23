/**
 * 工作台页：换头像 / 换封面（混入 Page 方法）
 */
const portalEdit = require('./portalAvatarEdit.js');
const util = require('./util.js');
const api = require('../api/index.js');

function normalizePortalProfilePayload(res) {
  if (!res || typeof res !== 'object') return {};
  if (res.data && typeof res.data === 'object') return res.data;
  return res;
}

function createPortalCoverHandlers(role) {
  return {
    async onEditAvatar() {
      try {
        const path = await portalEdit.chooseUploadAndGetPath();
        if (role === 'worker') {
          await api.worker.updateMyProfile({ avatar_url: path });
        } else {
          await api.user.updateProfileFields({ avatar_url: path });
        }
        const display = portalEdit.syncGlobalUserPhoto(getApp(), path);
        this.setData({ userPhoto: display });
        wx.showToast({ title: '头像已更新', icon: 'success' });
      } catch (e) {
        if (e && e.errmsg) wx.showToast({ title: e.errmsg, icon: 'none' });
      }
    },

    async onEditCover() {
      try {
        const path = await portalEdit.chooseUploadAndGetPath();
        if (role === 'worker') {
          await api.worker.updateMyProfile({ work_photo_url: path });
          this.setData({ coverImage: util.imgUrl(path, path) });
        } else if (role === 'service_provider') {
          await api.serviceProvider.updateProfile({ logo: path, shop_front_url: path });
          this.setData({ coverImage: util.imgUrl(path, path) });
        } else if (role === 'merchant') {
          await api.merchant.updateShop({ cover_url: path });
          this.setData({ coverImage: util.imgUrl(path, path) });
        }
        wx.showToast({ title: '封面已更新', icon: 'success' });
      } catch (e) {
        if (e && e.errmsg) wx.showToast({ title: e.errmsg, icon: 'none' });
      }
    },

    async loadPortalCoverImages(roleKey, portalOk) {
      if (!portalOk && roleKey !== 'worker') {
        this.setData({ coverImage: '' });
        return;
      }
      try {
        if (roleKey === 'worker') {
          const raw = await api.worker.getMyProfile();
          const p = normalizePortalProfilePayload(raw);
          const av = p.avatar_url || '';
          const cover = p.work_photo_url || '';
          const patch = {};
          if (av) patch.userPhoto = portalEdit.syncGlobalUserPhoto(getApp(), av);
          patch.coverImage = cover ? util.imgUrl(cover, cover) : '';
          this.setData(patch);
          return;
        }
        if (roleKey === 'service_provider') {
          const raw = await api.serviceProvider.getProfile();
          const profile = raw.profile || raw.data || raw;
          const cover = profile.shop_front_url || profile.logo || '';
          this.setData({
            coverImage: cover ? util.imgUrl(cover, cover) : ''
          });
          return;
        }
        if (roleKey === 'merchant') {
          const raw = await api.merchant.getShop();
          const shop = raw.shop || raw.data || raw;
          const cover = shop.cover_url || shop.coverUrl || shop.cover || shop.cover_image || '';
          this.setData({
            coverImage: cover ? util.imgUrl(cover, cover) : ''
          });
        }
      } catch (e) {
        /* ignore */
      }
    }
  };
}

module.exports = { createPortalCoverHandlers };
