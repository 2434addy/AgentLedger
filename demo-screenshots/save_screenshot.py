"""Save a base64-encoded image string to a PNG file."""
import base64
import sys

def save_b64(b64_data, filename):
    # Strip data URL prefix if present
    if ',' in b64_data:
        b64_data = b64_data.split(',', 1)[1]
    img_bytes = base64.b64decode(b64_data)
    with open(filename, 'wb') as f:
        f.write(img_bytes)
    print(f"Saved {filename} ({len(img_bytes)} bytes)")

if __name__ == "__main__":
    save_b64(sys.argv[1], sys.argv[2])
