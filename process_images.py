#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图像处理脚本：去除图像顶部180像素和底部50像素
"""

import os
from PIL import Image
import glob

# 源目录和目标目录
source_dir = r"C:\Users\Administrator\Desktop\icon"
target_dir = r"d:\CODE\project\community\素材\家政"

# 确保目标目录存在
os.makedirs(target_dir, exist_ok=True)

# 支持的图片格式
image_extensions = ('*.jpg', '*.jpeg', '*.png', '*.bmp', '*.gif', '*.webp')

# 获取所有图片文件
image_files = []
for ext in image_extensions:
    image_files.extend(glob.glob(os.path.join(source_dir, ext)))
    image_files.extend(glob.glob(os.path.join(source_dir, ext.upper())))

print(f"找到 {len(image_files)} 张图片")

# 处理每张图片
for img_path in image_files:
    try:
        # 获取文件名
        filename = os.path.basename(img_path)
        name, ext = os.path.splitext(filename)
        
        # 打开图片
        with Image.open(img_path) as img:
            width, height = img.size
            print(f"处理: {filename} ({width}x{height})")
            
            # 计算裁剪区域
            # 去除顶部180像素和底部200像素
            top = 180
            bottom = height - 200
            
            # 确保裁剪区域有效
            if bottom <= top:
                print(f"  跳过: 图片高度不足")
                continue
            
            # 裁剪图片 (left, top, right, bottom)
            cropped = img.crop((0, top, width, bottom))
            
            # 保存处理后的图片
            output_path = os.path.join(target_dir, f"{name}_cropped{ext}")
            
            # 处理透明度问题
            if cropped.mode in ('RGBA', 'LA', 'P'):
                # 转换为RGB模式以避免保存问题
                background = Image.new('RGB', cropped.size, (255, 255, 255))
                if cropped.mode == 'P':
                    cropped = cropped.convert('RGBA')
                if cropped.mode in ('RGBA', 'LA'):
                    background.paste(cropped, mask=cropped.split()[-1] if cropped.mode in ('RGBA', 'LA') else None)
                    cropped = background
            
            cropped.save(output_path, quality=95)
            print(f"  已保存: {output_path} ({cropped.size[0]}x{cropped.size[1]})")
            
    except Exception as e:
        print(f"  错误处理 {img_path}: {str(e)}")

print("\n处理完成!")
print(f"处理后的图片保存在: {target_dir}")
