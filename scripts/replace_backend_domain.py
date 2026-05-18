#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将仓库内旧后端主机名全文替换为新主机名（默认 jshsp1.eds-tech.cn -> jshsp1.eds-tech.cn）。

用法:
  python scripts/replace_backend_domain.py
  python scripts/replace_backend_domain.py --to api.example.com
  python scripts/replace_backend_domain.py --from old.host.cn --to new.host.cn --dry-run
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# 不参与扫描的目录名（小写比较）
SKIP_DIR_NAMES = frozenset(
    {
        ".git",
        "node_modules",
        "__pycache__",
        ".venv",
        "venv",
        "miniprogram_npm",
        "dist",
        "build",
        ".svn",
        ".hg",
    }
)

# 跳过的文件后缀（二进制或无需替换）
SKIP_SUFFIXES = frozenset(
    {
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".ico",
        ".pdf",
        ".zip",
        ".7z",
        ".rar",
        ".woff",
        ".woff2",
        ".ttf",
        ".eot",
        ".mp3",
        ".mp4",
        ".wasm",
    }
)

MAX_FILE_BYTES = 8 * 1024 * 1024


def is_probably_text(raw: bytes) -> bool:
    sample = raw[:8192]
    if b"\x00" in sample:
        return False
    return True


def iter_files(root: Path, self_path: Path):
    self_resolved = self_path.resolve()
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if p.resolve() == self_resolved:
            continue
        rel = p.relative_to(root)
        parts_lower = [x.lower() for x in rel.parts]
        if any(pn in SKIP_DIR_NAMES for pn in parts_lower):
            continue
        if p.suffix.lower() in SKIP_SUFFIXES:
            continue
        try:
            st = p.stat()
        except OSError:
            continue
        if st.st_size > MAX_FILE_BYTES:
            continue
        yield p


def replace_in_file(path: Path, old: str, new: str, dry_run: bool) -> int:
    raw = path.read_bytes()
    if not raw or old.encode("utf-8") not in raw:
        return 0
    if not is_probably_text(raw):
        return 0
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return 0
    if old not in text:
        return 0
    new_text = text.replace(old, new)
    if new_text == text:
        return 0
    if not dry_run:
        path.write_bytes(new_text.encode("utf-8"))
    return text.count(old)


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    default_root = script_dir.parent

    ap = argparse.ArgumentParser(description="批量替换仓库中的后端服务域名（主机名）。")
    ap.add_argument(
        "--root",
        type=Path,
        default=default_root,
        help=f"项目根目录（默认: {default_root}）",
    )
    ap.add_argument(
        "--from",
        dest="from_host",
        default="jshsp1.eds-tech.cn",
        help="原主机名（默认: jshsp1.eds-tech.cn）",
    )
    ap.add_argument(
        "--to",
        dest="to_host",
        default="jshsp1.eds-tech.cn",
        help="新主机名（默认: jshsp1.eds-tech.cn）",
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="只统计将要替换的次数，不写文件",
    )
    args = ap.parse_args()

    root: Path = args.root.resolve()
    old = args.from_host.strip()
    new = args.to_host.strip()
    if not old or not new:
        print("错误: --from 与 --to 不能为空", file=sys.stderr)
        return 2
    if old == new:
        print("错误: 源与目标相同，无需替换", file=sys.stderr)
        return 2
    if not root.is_dir():
        print(f"错误: 根目录不存在: {root}", file=sys.stderr)
        return 2

    total_hits = 0
    touched = 0
    self_script = Path(__file__).resolve()
    for path in sorted(iter_files(root, self_script), key=lambda p: str(p).lower()):
        n = replace_in_file(path, old, new, args.dry_run)
        if n:
            total_hits += n
            touched += 1
            rel = path.relative_to(root)
            print(f"{'[dry-run] ' if args.dry_run else ''}{rel}: {n} 处")

    mode = "（预览，未写入）" if args.dry_run else ""
    print(f"\n完成{mode}: {touched} 个文件，共替换 {total_hits} 处「{old}」→「{new}」")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
