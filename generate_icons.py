#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
根据家政图像生成图标
处理流程：
1. 读取家政文件夹中的图片
2. 生成多种尺寸的图标（16x16, 32x32, 64x64, 128x128, 256x256）
3. 生成圆角图标
4. 生成圆形图标
5. 保存到 icons 目录
"""

import os
from PIL import Image, ImageDraw
import glob

# 源目录和目标目录
source_dir = r"d:\CODE\project\community\素材\家政"
target_dir = r"d:\CODE\project\community\素材\家政\icons"

# 确保目标目录存在
os.makedirs(target_dir, exist_ok=True)

# 图标尺寸
icon_sizes = [16, 32, 64, 128, 256]

# 获取所有图片文件
image_files = []
for ext in ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.gif', '*.webp']:
    image_files.extend(glob.glob(os.path.join(source_dir, ext)))
    image_files.extend(glob.glob(os.path.join(source_dir, ext.upper())))

# 过滤掉已经处理过的文件和README
image_files = [f for f in image_files if '_cropped' in f and 'README' not in f]

print(f"找到 {len(image_files)} 张图片用于生成图标")

def create_rounded_corners(img, radius):
    """创建圆角图片"""
    circle = Image.new('L', (radius * 2, radius * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, radius * 2, radius * 2), fill=255)
    
    alpha = Image.new('L', img.size, 255)
    w, h = img.size
    
    # 左上角
    alpha.paste(circle.crop((0, 0, radius, radius)), (0, 0))
    # 右上角
    alpha.paste(circle.crop((radius, 0, radius * 2, radius)), (w - radius, 0))
    # 左下角
    alpha.paste(circle.crop((0, radius, radius, radius * 2)), (0, h - radius))
    # 右下角
    alpha.paste(circle.crop((radius, radius, radius * 2, radius * 2)), (w - radius, h - radius))
    
    img.putalpha(alpha)
    return img

def create_circle_icon(img):
    """创建圆形图标"""
    size = min(img.size)
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    
    # 创建圆形图片
    output = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    
    # 将原图裁剪为正方形并缩放
    w, h = img.size
    left = (w - size) // 2
    top = (h - size) // 2
    square_img = img.crop((left, top, left + size, top + size))
    
    output.paste(square_img, (0, 0))
    output.putalpha(mask)
    
    return output

# 处理每张图片
for idx, img_path in enumerate(image_files):
    try:
        filename = os.path.basename(img_path)
        name = os.path.splitext(filename)[0]
        # 清理文件名
        name = name.replace('_cropped', '').replace('jimeng-2026-03-17-', '').replace('jimeng-2026-02-26-', '')
        # 截取前20个字符作为简称
        short_name = name[:30] if len(name) > 30 else name
        
        print(f"\n处理 [{idx+1}/{len(image_files)}]: {short_name}")
        
        # 打开图片
        with Image.open(img_path) as img:
            # 转换为RGBA模式
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # 为每种尺寸生成图标
            for size in icon_sizes:
                # 创建图标目录
                size_dir = os.path.join(target_dir, f"{size}x{size}")
                os.makedirs(size_dir, exist_ok=True)
                
                # 1. 标准方形图标（带圆角）
                resized = img.copy()
                resized.thumbnail((size, size), Image.Resampling.LANCZOS)
                
                # 创建正方形背景
                square_icon = Image.new('RGBA', (size, size), (255, 255, 255, 255))
                x = (size - resized.width) // 2
                y = (size - resized.height) // 2
                square_icon.paste(resized, (x, y))
                
                # 添加圆角
                rounded_icon = create_rounded_corners(square_icon.copy(), size // 8)
                rounded_path = os.path.join(size_dir, f"{short_name}_rounded.png")
                rounded_icon.save(rounded_path)
                
                # 2. 圆形图标
                circle_icon = create_circle_icon(img.copy())
                circle_icon = circle_icon.resize((size, size), Image.Resampling.LANCZOS)
                circle_path = os.path.join(size_dir, f"{short_name}_circle.png")
                circle_icon.save(circle_path)
                
                print(f"  生成 {size}x{size} 图标")
            
            # 生成原始尺寸的处理版本
            original_dir = os.path.join(target_dir, "original")
            os.makedirs(original_dir, exist_ok=True)
            
            # 保存圆角版本
            rounded_original = create_rounded_corners(img.copy(), 30)
            rounded_original.save(os.path.join(original_dir, f"{short_name}_rounded.png"))
            
            # 保存圆形版本
            circle_original = create_circle_icon(img.copy())
            circle_original.save(os.path.join(original_dir, f"{short_name}_circle.png"))
            
    except Exception as e:
        print(f"  错误处理 {img_path}: {str(e)}")

print("\n" + "="*50)
print("图标生成完成!")
print(f"图标保存在: {target_dir}")
print("\n生成的图标类型:")
print("  - rounded: 圆角方形图标")
print("  - circle: 圆形图标")
print("\n尺寸包括: 16x16, 32x32, 64x64, 128x128, 256x256")
print("="*50)
