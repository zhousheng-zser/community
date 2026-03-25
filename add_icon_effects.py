#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为图标添加边缘特效
特效包括：
- 光源：左上 45°
- 高光：左上淡白
- 阴影：右下淡灰
- 渐变：上浅 ↘ 下深
- 圆角 + 细边框 = 精致立体
"""

import os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import glob

# 图标目录
icon_dir = r"d:\CODE\project\community\素材\家政\icons\256x256"

# 获取所有图标文件
icon_files = glob.glob(os.path.join(icon_dir, "*.png"))

print(f"找到 {len(icon_files)} 个图标文件")

def add_icon_effects(input_path, output_path):
    """为图标添加边缘特效"""
    try:
        # 打开图标
        with Image.open(input_path) as img:
            # 确保是RGBA模式
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            width, height = img.size
            
            # 1. 创建背景图层
            background = Image.new('RGBA', (width, height), (255, 255, 255, 0))
            
            # 2. 创建阴影效果
            shadow = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            shadow_draw = ImageDraw.Draw(shadow)
            
            # 绘制阴影（右下）
            shadow_radius = 8
            shadow_offset = (5, 5)
            
            # 绘制圆角矩形阴影
            radius = 30
            x1, y1 = shadow_offset
            x2, y2 = width - shadow_offset[0], height - shadow_offset[1]
            
            # 绘制圆角矩形
            shadow_draw.rounded_rectangle(
                [(x1, y1), (x2, y2)],
                radius=radius,
                fill=(100, 100, 100, 30)
            )
            
            # 模糊阴影
            shadow = shadow.filter(ImageFilter.GaussianBlur(radius=3))
            
            # 3. 创建高光效果（左上）
            highlight = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            highlight_draw = ImageDraw.Draw(highlight)
            
            # 绘制高光区域
            highlight_radius = 25
            highlight_draw.ellipse(
                [(0, 0), (highlight_radius*2, highlight_radius*2)],
                fill=(255, 255, 255, 80)
            )
            
            # 模糊高光
            highlight = highlight.filter(ImageFilter.GaussianBlur(radius=5))
            
            # 4. 创建渐变效果
            gradient = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            gradient_draw = ImageDraw.Draw(gradient)
            
            # 绘制渐变矩形
            for y in range(height):
                # 从上到下渐变，上浅下深
                alpha = int(5 + (y / height) * 15)
                gradient_draw.line(
                    [(0, y), (width, y)],
                    fill=(240, 240, 240, alpha)
                )
            
            # 5. 绘制边框
            border = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            border_draw = ImageDraw.Draw(border)
            
            # 绘制细边框
            border_width = 2
            border_draw.rounded_rectangle(
                [(border_width, border_width), (width - border_width, height - border_width)],
                radius=radius - border_width,
                outline=(200, 200, 200, 100),
                width=border_width
            )
            
            # 6. 组合所有图层
            # 背景
            result = Image.new('RGBA', (width, height), (255, 255, 255, 255))
            
            # 添加阴影
            result.paste(shadow, (0, 0), shadow)
            
            # 添加原始图标
            result.paste(img, (0, 0), img)
            
            # 添加渐变
            result.paste(gradient, (0, 0), gradient)
            
            # 添加高光
            result.paste(highlight, (0, 0), highlight)
            
            # 添加边框
            result.paste(border, (0, 0), border)
            
            # 7. 保存结果
            result.save(output_path, quality=95)
            print(f"  已处理: {os.path.basename(input_path)}")
            
    except Exception as e:
        print(f"  错误处理 {input_path}: {str(e)}")

# 处理所有图标
for icon_path in icon_files:
    # 生成输出路径（在文件名后添加 _effect）
    base_name = os.path.basename(icon_path)
    name, ext = os.path.splitext(base_name)
    output_path = os.path.join(icon_dir, f"{name}_effect{ext}")
    
    print(f"处理: {base_name}")
    add_icon_effects(icon_path, output_path)

print("\n处理完成！所有图标已添加特效。")
