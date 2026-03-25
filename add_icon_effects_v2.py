#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为图标添加高级特效
特效包括：
- 统一光源：左上 45°
- 外阴影（让圆 "浮起来"）
- 内阴影 / 内发光（做出 "鼓起来" 的体积）
- 高光（点睛，立刻立体）
- 渐变（强化立体感）
"""

import os
from PIL import Image, ImageDraw, ImageFilter
import glob

# 图标目录
icon_dir = r"d:\CODE\project\community\素材\家政\icons\256x256"

# 获取所有图标文件
icon_files = glob.glob(os.path.join(icon_dir, "*.png"))

print(f"找到 {len(icon_files)} 个图标文件")

def add_icon_effects(input_path, output_path):
    """为图标添加高级特效"""
    try:
        # 打开图标
        with Image.open(input_path) as img:
            # 确保是RGBA模式
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            width, height = img.size
            size = min(width, height)
            
            # 1. 创建基础画布
            result = Image.new('RGBA', (width, height), (255, 255, 255, 0))
            
            # 2. 创建外阴影（让圆浮起来）
            shadow = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            shadow_draw = ImageDraw.Draw(shadow)
            
            # 绘制圆形阴影
            shadow_radius = size // 2
            shadow_offset = (8, 8)  # 右下偏移
            shadow_center = (width // 2 + shadow_offset[0], height // 2 + shadow_offset[1])
            
            # 绘制阴影圆
            shadow_draw.ellipse(
                [
                    (shadow_center[0] - shadow_radius, shadow_center[1] - shadow_radius),
                    (shadow_center[0] + shadow_radius, shadow_center[1] + shadow_radius)
                ],
                fill=(100, 100, 100, 40)  # 浅灰色阴影
            )
            
            # 模糊阴影（柔和效果）
            shadow = shadow.filter(ImageFilter.GaussianBlur(radius=15))
            
            # 3. 创建内阴影和内发光（做出鼓起来的体积）
            inner_effect = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            inner_draw = ImageDraw.Draw(inner_effect)
            
            # 绘制内阴影（右下侧）
            inner_radius = size // 2 - 2
            inner_center = (width // 2, height // 2)
            
            # 右下内阴影
            inner_shadow_offset = (5, 5)
            inner_shadow_center = (inner_center[0] + inner_shadow_offset[0], inner_center[1] + inner_shadow_offset[1])
            
            inner_draw.ellipse(
                [
                    (inner_shadow_center[0] - inner_radius, inner_shadow_center[1] - inner_radius),
                    (inner_shadow_center[0] + inner_radius, inner_shadow_center[1] + inner_radius)
                ],
                fill=(0, 0, 0, 30)  # 深色内阴影
            )
            
            # 4. 创建高光（左上角细细的高光弧线）
            highlight = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            highlight_draw = ImageDraw.Draw(highlight)
            
            # 左上角高光
            highlight_radius = size // 3
            highlight_center = (width // 2 - size // 3, height // 2 - size // 3)
            
            # 绘制高光椭圆
            highlight_draw.ellipse(
                [
                    (highlight_center[0] - highlight_radius, highlight_center[1] - highlight_radius),
                    (highlight_center[0] + highlight_radius, highlight_center[1] + highlight_radius)
                ],
                fill=(255, 255, 255, 40)  # 低透明度高光
            )
            
            # 模糊高光
            highlight = highlight.filter(ImageFilter.GaussianBlur(radius=8))
            
            # 5. 创建渐变（上浅下深）
            gradient = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            gradient_draw = ImageDraw.Draw(gradient)
            
            # 绘制径向渐变
            for y in range(height):
                # 从上到下渐变，上浅下深
                alpha = int(10 + (y / height) * 20)
                gradient_draw.line(
                    [(0, y), (width, y)],
                    fill=(245, 245, 245, alpha)
                )
            
            # 6. 组合所有图层
            # 添加外阴影
            result.paste(shadow, (0, 0), shadow)
            
            # 添加原始图标
            result.paste(img, (0, 0), img)
            
            # 添加内阴影
            result.paste(inner_effect, (0, 0), inner_effect)
            
            # 添加渐变
            result.paste(gradient, (0, 0), gradient)
            
            # 添加高光
            result.paste(highlight, (0, 0), highlight)
            
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
