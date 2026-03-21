"""
Stitch demo screenshots into an MP4 video for Twitter.
Usage: python capture_and_video.py <screenshot_dir> <output_file>
Each PNG in the directory is shown for ~3 seconds with a smooth fade transition.
"""
import cv2
import numpy as np
import glob
import os
import sys

def create_demo_video(img_dir, output_path, fps=30, hold_seconds=3, fade_frames=15):
    patterns = [os.path.join(img_dir, f"*.png")]
    files = sorted(glob.glob(patterns[0]))
    if not files:
        print("No PNG files found in", img_dir)
        return

    print(f"Found {len(files)} screenshots")

    # Read all images and resize to consistent dimensions
    images = []
    target_w, target_h = 1280, 720  # Twitter-friendly 16:9
    for f in files:
        img = cv2.imread(f)
        if img is None:
            print(f"  Skipping unreadable: {f}")
            continue
        # Resize maintaining aspect ratio with padding
        h, w = img.shape[:2]
        scale = min(target_w / w, target_h / h)
        new_w, new_h = int(w * scale), int(h * scale)
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

        # Center on black background
        canvas = np.zeros((target_h, target_w, 3), dtype=np.uint8)
        x_off = (target_w - new_w) // 2
        y_off = (target_h - new_h) // 2
        canvas[y_off:y_off+new_h, x_off:x_off+new_w] = resized
        images.append(canvas)
        print(f"  Added: {os.path.basename(f)}")

    if len(images) < 2:
        print("Need at least 2 images")
        return

    # Create video
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (target_w, target_h))

    hold_frames = int(hold_seconds * fps)

    for i, img in enumerate(images):
        # Hold frame
        for _ in range(hold_frames):
            out.write(img)

        # Fade transition to next image
        if i < len(images) - 1:
            next_img = images[i + 1]
            for f in range(fade_frames):
                alpha = f / fade_frames
                blended = cv2.addWeighted(img, 1 - alpha, next_img, alpha, 0)
                out.write(blended)

    # Hold last frame a bit longer
    for _ in range(hold_frames):
        out.write(images[-1])

    out.release()
    print(f"\nVideo saved to: {output_path}")
    print(f"Duration: ~{len(images) * hold_seconds + (len(images)-1) * fade_frames/fps:.1f}s")

if __name__ == "__main__":
    img_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    output = sys.argv[2] if len(sys.argv) > 2 else "agentledger_demo.mp4"
    create_demo_video(img_dir, output)
