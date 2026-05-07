#!/usr/bin/env python3
"""
Extract sharp frames from a video by sampling every N frames and keeping only
frames that exceed a sharpness (Laplacian variance) threshold.
"""

import cv2
import os
import sys


def compute_sharpness(frame):
    """Return the variance of the Laplacian (higher = sharper)."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()


def main(video_path, output_dir, sample_interval=5, sharpness_threshold=100.0):
    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: cannot open video {video_path}")
        sys.exit(1)

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    print(f"Total frames: {total_frames}, FPS: {fps:.2f}")

    frame_idx = 0
    saved_count = 0
    examined_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Sample every N frames
        if frame_idx % sample_interval == 0:
            sharpness = compute_sharpness(frame)
            examined_count += 1
            if sharpness >= sharpness_threshold:
                saved_count += 1
                filename = os.path.join(output_dir, f"frame_{frame_idx:06d}_sharp_{sharpness:.1f}.jpg")
                cv2.imwrite(filename, frame)
                print(f"Saved {filename} (sharpness={sharpness:.1f})")
            else:
                print(f"Skipped frame {frame_idx} (sharpness={sharpness:.1f} < {sharpness_threshold})")

        frame_idx += 1

    cap.release()
    print(f"\nDone. Examined {examined_count} frames, saved {saved_count} sharp frames to {output_dir}")


if __name__ == "__main__":
    VIDEO = "/home/cw/a/community-backend/20260507_135517.mp4"
    OUT = "/home/cw/a/community-backend/aaa/sharp_frames"
    # 每5帧抽1帧，清晰度阈值设为100（可根据实际情况调整）
    main(VIDEO, OUT, sample_interval=5, sharpness_threshold=100.0)
