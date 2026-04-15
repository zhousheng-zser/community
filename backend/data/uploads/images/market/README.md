# 本地集市示例图片（静态资源）

本目录由脚本从 **Unsplash**、**Pexels** 下载，文件名已改为英文语义，便于识别内容。

## 目录约定（2026-03）

分层存储（与 DB 中 `/uploads/market/...` 一致）：

```
market/{店铺分类 category}/{shop_no}/
  shop_media/          ← 店铺非商品图：logo、cover、facade、interior、license
  goods/{category_key}/ ← 商品主图：{goods_no}.{ext}
```

- **迁移脚本**：`backend` 目录执行 `node scripts/restructure_market_images.js`（将旧扁平路径迁到上述结构并改库）。若库中路径指向的文件不存在（如 `.png` 占位），会自动尝试同目录其它扩展名，并回退到扁平示例图 `market_shop01_*.jpg` / `market_goods_*.jpg`（见 `scripts/lib/market_image_fallbacks.js`）。脚本会先修正错误店号 **`SHOP20010` → `SHOP2010`**（若存在）。
- **扁平历史文件**：如 `market_shop01_logo_*.jpg` 仍可作为复制源；seed 会 `mkdir` + `cp` 到分层路径。

## 许可说明

- **Unsplash**：https://unsplash.com/license — 免费下载与使用（含商业用途），无需署名（署名仍被鼓励）。
- **Pexels**：https://pexels.com/license/ — 免费使用，含商业用途。

## 命名约定

- `market_shop01_*` … `market_shop03_*`：三家示例店铺（logo / cover / facade / interior / license）。
- `market_goods_*`：示例商品主图。

## 重新下载

若需更换图源，可自建脚本使用上述站点提供的直链；勿用未授权素材。
