import os
import sys
from PIL import Image

IMG_DIR = 'img'
QUALITY = 85

# PNG 转压缩 PNG（使用量化调色板），JPEG 用质量压缩
# 同时支持将大图缩放（如果尺寸超过 256x256，缩放到合适的尺寸）

def compress_image(src_path):
    ext = os.path.splitext(src_path)[1].lower()
    if ext not in ('.png', '.jpg', '.jpeg'):
        return 0, 0

    try:
        original_size = os.path.getsize(src_path)
        img = Image.open(src_path)
        # 转换模式以兼容
        if img.mode in ('RGBA', 'P'):
            if ext in ('.jpg', '.jpeg'):
                img = img.convert('RGB')
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # 针对小图标，如果尺寸 <= 128x128，保持原尺寸；大图适度缩放
        w, h = img.size
        max_dim = max(w, h)
        if max_dim > 256:
            ratio = 256 / max_dim
            new_size = (int(w * ratio), int(h * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        if ext == '.png':
            # 尝试量化调色板压缩
            if img.mode == 'RGBA':
                img.save(src_path, 'PNG', optimize=True)
            else:
                # 尝试转换为调色板模式
                try:
                    p = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
                    p.save(src_path, 'PNG', optimize=True)
                except Exception:
                    img.save(src_path, 'PNG', optimize=True)
        else:
            img.save(src_path, 'JPEG', quality=QUALITY, optimize=True)

        new_size = os.path.getsize(src_path)
        saved = original_size - new_size
        return saved, original_size
    except Exception as e:
        print(f"  Error processing {src_path}: {e}")
        return 0, 0

def main():
    total_saved = 0
    total_original = 0
    files_processed = 0
    for root, dirs, files in os.walk(IMG_DIR):
        # 跳过已经被排除的目录
        if 'undraw' in root or 'icons' in root:
            continue
        for f in files:
            if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                path = os.path.join(root, f)
                saved, orig = compress_image(path)
                if orig > 0:
                    total_saved += saved
                    total_original += orig
                    files_processed += 1
                    pct = (saved / orig) * 100 if orig > 0 else 0
                    if saved > 0:
                        print(f"  {path}: {orig//1024}KB -> {(orig-saved)//1024}KB ({pct:.1f}% saved)")

    print(f"\nProcessed {files_processed} files")
    print(f"Original: {total_original // 1024} KB")
    print(f"Saved: {total_saved // 1024} KB ({(total_saved/total_original)*100:.1f}%)")
    print(f"New: {(total_original - total_saved) // 1024} KB")

if __name__ == '__main__':
    main()
