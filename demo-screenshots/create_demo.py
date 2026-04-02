"""
AgentLedger MVP Demo Video Generator
Captures screenshots of all dashboard pages and stitches into MP4.
"""
import time
from playwright.sync_api import sync_playwright
import cv2
import numpy as np
import os

SCREENSHOT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_VIDEO = os.path.join(os.path.dirname(SCREENSHOT_DIR), "agentledger_demo.mp4")
BASE_URL = "http://localhost:3000"

PAGES = [
    ("01_landing", "/", "Landing Page"),
    ("02_login", "/login", "Login"),
    ("03_overview", "/overview", "Dashboard Overview"),
    ("04_agents", "/agents", "Agents"),
    ("05_sessions", "/sessions", "Sessions"),
    ("06_events", "/events", "Events"),
    ("07_cost", "/cost-analytics", "Cost Analytics"),
    ("08_anomaly", "/anomaly-detection", "Anomaly Detection"),
    ("09_replay", "/session-replay", "Session Replay"),
    ("10_compliance", "/compliance", "Compliance"),
    ("11_settings", "/settings", "Settings"),
]

def capture_screenshots():
    print("=== Capturing Screenshots ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        # 1. Landing page
        page.goto(f"{BASE_URL}/")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        path = os.path.join(SCREENSHOT_DIR, "01_landing.png")
        page.screenshot(path=path)
        print(f"  Captured: Landing Page")

        # 2. Login page
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        path = os.path.join(SCREENSHOT_DIR, "02_login.png")
        page.screenshot(path=path)
        print(f"  Captured: Login Page")

        # 3. Actually login
        page.fill('input[placeholder*="example"], input[type="email"]', 'demo@agentledger.io')
        page.fill('input[type="password"]', 'Demo@2026!')
        time.sleep(0.5)

        # Capture filled login form
        path = os.path.join(SCREENSHOT_DIR, "02b_login_filled.png")
        page.screenshot(path=path)
        print(f"  Captured: Login Filled")

        # Submit login
        page.click('button[type="submit"]')
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # 3. Overview
        page.goto(f"{BASE_URL}/overview")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        path = os.path.join(SCREENSHOT_DIR, "03_overview.png")
        page.screenshot(path=path)
        print(f"  Captured: Overview")

        # 4. Agents
        page.goto(f"{BASE_URL}/agents")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        path = os.path.join(SCREENSHOT_DIR, "04_agents.png")
        page.screenshot(path=path)
        print(f"  Captured: Agents")

        # 5. Sessions
        page.goto(f"{BASE_URL}/sessions")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        path = os.path.join(SCREENSHOT_DIR, "05_sessions.png")
        page.screenshot(path=path)
        print(f"  Captured: Sessions")

        # 6. Events
        page.goto(f"{BASE_URL}/events")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        path = os.path.join(SCREENSHOT_DIR, "06_events.png")
        page.screenshot(path=path)
        print(f"  Captured: Events")

        # 7. Cost Analytics
        page.goto(f"{BASE_URL}/cost-analytics")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        path = os.path.join(SCREENSHOT_DIR, "07_cost.png")
        page.screenshot(path=path)
        print(f"  Captured: Cost Analytics")

        # 8. Anomaly Detection
        page.goto(f"{BASE_URL}/anomaly-detection")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        path = os.path.join(SCREENSHOT_DIR, "08_anomaly.png")
        page.screenshot(path=path)
        print(f"  Captured: Anomaly Detection")

        # 9. Session Replay
        page.goto(f"{BASE_URL}/session-replay")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        path = os.path.join(SCREENSHOT_DIR, "09_replay.png")
        page.screenshot(path=path)
        print(f"  Captured: Session Replay")

        # 10. Compliance
        page.goto(f"{BASE_URL}/compliance")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        path = os.path.join(SCREENSHOT_DIR, "10_compliance.png")
        page.screenshot(path=path)
        print(f"  Captured: Compliance")

        # 11. Settings
        page.goto(f"{BASE_URL}/settings")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        path = os.path.join(SCREENSHOT_DIR, "11_settings.png")
        page.screenshot(path=path)
        print(f"  Captured: Settings")

        # Scroll down on settings to show API keys
        page.evaluate("window.scrollBy(0, 400)")
        time.sleep(0.5)
        path = os.path.join(SCREENSHOT_DIR, "12_settings_keys.png")
        page.screenshot(path=path)
        print(f"  Captured: Settings API Keys")

        browser.close()

    print(f"\nAll screenshots saved to: {SCREENSHOT_DIR}")


def add_label(img, text, position="bottom"):
    """Add a text label overlay to the image."""
    h, w = img.shape[:2]
    overlay = img.copy()

    # Semi-transparent bar
    bar_h = 50
    if position == "bottom":
        y1 = h - bar_h
        y2 = h
    else:
        y1 = 0
        y2 = bar_h

    cv2.rectangle(overlay, (0, y1), (w, y2), (0, 0, 0), -1)
    img = cv2.addWeighted(overlay, 0.7, img, 0.3, 0)

    # Text
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.8
    thickness = 2
    text_size = cv2.getTextSize(text, font, font_scale, thickness)[0]
    text_x = (w - text_size[0]) // 2
    text_y = y1 + (bar_h + text_size[1]) // 2

    cv2.putText(img, text, (text_x, text_y), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)
    return img


def create_video():
    print("\n=== Creating Video ===")
    import glob

    files = sorted(glob.glob(os.path.join(SCREENSHOT_DIR, "*.png")))
    if not files:
        print("No screenshots found!")
        return

    labels = {
        "01_landing.png": "AgentLedger - Black Box Recorder for AI Agents",
        "02_login.png": "Sign In",
        "02b_login_filled.png": "Logging in with credentials",
        "03_overview.png": "Dashboard Overview - Real-time metrics",
        "04_agents.png": "Agents - Monitor all your AI agents",
        "05_sessions.png": "Sessions - Track every conversation",
        "06_events.png": "Events - Full audit trail with SHA-256 hashing",
        "07_cost.png": "Cost Analytics - Break down spend by model",
        "08_anomaly.png": "Anomaly Detection - Automatic alerts",
        "09_replay.png": "Session Replay - Debug any session",
        "10_compliance.png": "Compliance - One-click reports",
        "11_settings.png": "Settings - Profile & Organisation",
        "12_settings_keys.png": "API Keys - Secure key management",
    }

    target_w, target_h = 1280, 720
    fps = 30
    hold_seconds = 3
    fade_frames = 20

    images = []
    for f in files:
        img = cv2.imread(f)
        if img is None:
            continue
        h, w = img.shape[:2]
        scale = min(target_w / w, target_h / h)
        new_w, new_h = int(w * scale), int(h * scale)
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
        canvas = np.zeros((target_h, target_w, 3), dtype=np.uint8)
        x_off = (target_w - new_w) // 2
        y_off = (target_h - new_h) // 2
        canvas[y_off:y_off+new_h, x_off:x_off+new_w] = resized

        # Add label
        basename = os.path.basename(f)
        label = labels.get(basename, basename)
        canvas = add_label(canvas, label)

        images.append(canvas)
        print(f"  Processed: {basename} -> {label}")

    if len(images) < 2:
        print("Need at least 2 images")
        return

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(OUTPUT_VIDEO, fourcc, fps, (target_w, target_h))

    hold_frames = int(hold_seconds * fps)

    # Title card (black with text)
    title = np.zeros((target_h, target_w, 3), dtype=np.uint8)
    font = cv2.FONT_HERSHEY_SIMPLEX

    # "AgentLedger" title
    text1 = "AgentLedger"
    size1 = cv2.getTextSize(text1, font, 2.0, 3)[0]
    cv2.putText(title, text1, ((target_w - size1[0])//2, target_h//2 - 40), font, 2.0, (124, 58, 237), 3, cv2.LINE_AA)

    # Subtitle
    text2 = "MVP Demo - Black Box Recorder for AI Agents"
    size2 = cv2.getTextSize(text2, font, 0.7, 2)[0]
    cv2.putText(title, text2, ((target_w - size2[0])//2, target_h//2 + 20), font, 0.7, (200, 200, 200), 2, cv2.LINE_AA)

    # Hold title
    for _ in range(hold_frames * 2):
        out.write(title)

    # Fade from title to first image
    for f in range(fade_frames):
        alpha = f / fade_frames
        blended = cv2.addWeighted(title, 1 - alpha, images[0], alpha, 0)
        out.write(blended)

    # Write all screenshots with transitions
    for i, img in enumerate(images):
        for _ in range(hold_frames):
            out.write(img)

        if i < len(images) - 1:
            for f in range(fade_frames):
                alpha = f / fade_frames
                blended = cv2.addWeighted(img, 1 - alpha, images[i+1], alpha, 0)
                out.write(blended)

    # End card
    end = np.zeros((target_h, target_w, 3), dtype=np.uint8)
    text3 = "Try AgentLedger Today"
    size3 = cv2.getTextSize(text3, font, 1.5, 3)[0]
    cv2.putText(end, text3, ((target_w - size3[0])//2, target_h//2 - 20), font, 1.5, (16, 185, 129), 3, cv2.LINE_AA)

    text4 = "agentledger.io"
    size4 = cv2.getTextSize(text4, font, 0.8, 2)[0]
    cv2.putText(end, text4, ((target_w - size4[0])//2, target_h//2 + 30), font, 0.8, (200, 200, 200), 2, cv2.LINE_AA)

    # Fade to end card
    for f in range(fade_frames):
        alpha = f / fade_frames
        blended = cv2.addWeighted(images[-1], 1 - alpha, end, alpha, 0)
        out.write(blended)

    for _ in range(hold_frames * 2):
        out.write(end)

    out.release()

    total_frames = (hold_frames * 2) + fade_frames + sum(hold_frames + (fade_frames if i < len(images)-1 else 0) for i in range(len(images))) + fade_frames + (hold_frames * 2)
    duration = total_frames / fps
    print(f"\nVideo saved: {OUTPUT_VIDEO}")
    print(f"Duration: ~{duration:.1f}s | Resolution: {target_w}x{target_h} | FPS: {fps}")


if __name__ == "__main__":
    capture_screenshots()
    create_video()
    print("\nDone! Your demo video is ready.")
