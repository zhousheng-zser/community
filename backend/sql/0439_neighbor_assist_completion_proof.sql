-- 帮帮订单：服务完成凭证照片
ALTER TABLE neighbor_assist_orders
  ADD COLUMN completion_proof_images JSON NULL COMMENT '服务完成凭证图片URL列表';
