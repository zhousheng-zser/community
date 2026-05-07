#!/usr/bin/env python3
"""
Extract the sharpest frame from every consecutive 15-frame group.
All frames are read; for each group of 15 consecutive frames,
the one with the highest Laplacian variance is saved.
"""

import cv2
import os
import sys


def compute_sharpness(frame):
    """Return the variance of the Laplacian (higher = sharper)."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()


def main(video_path, output_dir, group_size=15):
    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: cannot open video {video_path}")
        sys.exit(1)

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    print(f"Total frames: {total_frames}, FPS: {fps:.2f}")

    group_idx = 0
    saved_count = 0
    current_group = []   # list of (frame_idx, frame, sharpness)

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        sharpness = compute_sharpness(frame)
        current_group.append((frame_idx, frame, sharpness))

        # When group is full, pick the sharpest and save
        if len(current_group) == group_size:
            best = max(current_group, key=lambda x: x[2])
            best_frame_idx, best_frame, best_sharpness = best
            filename = os.path.join(
                output_dir,
                f"group_{group_idx:04d}_frame_{best_frame_idx:06d}_sharp_{best_sharpness:.1f}.jpg"
            )
            cv2.imwrite(filename, best_frame)
            print(f"Saved {filename} (sharpness={best_sharpness:.1f})")
            saved_count += 1
            group_idx += 1
            current_group = []

        frame_idx += 1

    # Handle remaining frames (last group < group_size)
    if current_group:
        best = max(current_group, key=lambda x: x[2])
        best_frame_idx, best_frame, best_sharpness = best
        filename = os.path.join(
            output_dir,
            f"group_{group_idx:04d}_frame_{best_frame_idx:06d}_sharp_{best_sharpness:.1f}.jpg"
        )
        cv2.imwrite(filename, best_frame)
        print(f"Saved {filename} (sharpness={best_sharpness:.1f}) [last partial group]")
        saved_count += 1
        group_idx += 1

    cap.release()
    print(f"\nDone. Total frames: {frame_idx}, groups: {group_idx}, saved: {saved_count}")


if __name__ == "__main__":
    VIDEO = "/home/cw/a/community-backend/20260507_135517.mp4"
    OUT = "/home/cw/a/community-backend/aaa/sharp_frames"
    main(VIDEO, OUT, group_size=15)
