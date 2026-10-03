"""Fetch and verify the offline speech recognition model (Vosk small English).

Invoked during the Docker build so the model is baked into the image.
"""

import hashlib
import os
import shutil
import sys
import urllib.request
import zipfile

MODEL_NAME = os.environ.get("VOSK_MODEL_NAME", "vosk-model-small-en-us-0.15")
EXPECTED_SHA256 = os.environ.get(
    "VOSK_MODEL_SHA256",
    "30f26242c4eb449f948e42cb302dd7a686cb29a3423a8367f99ff41780942498",
)
TARGET_DIR = os.environ.get("VOSK_TARGET_DIR", "/opt/vosk-model")


def main() -> None:
    archive_path = f"/tmp/{MODEL_NAME}.zip"
    url = f"https://alphacephei.com/vosk/models/{MODEL_NAME}.zip"

    print(f"Downloading Vosk speech model from {url} ...", flush=True)
    urllib.request.urlretrieve(url, archive_path)

    print("Verifying archive SHA-256 ...", flush=True)
    with open(archive_path, "rb") as f:
        digest = hashlib.file_digest(f, "sha256").hexdigest()

    if digest != EXPECTED_SHA256:
        print(f"ERROR: SHA-256 mismatch! Got {digest}, expected {EXPECTED_SHA256}", file=sys.stderr)
        sys.exit(1)

    print("Extracting model archive ...", flush=True)
    extract_path = "/tmp"
    with zipfile.ZipFile(archive_path) as z:
        z.extractall(extract_path)

    extracted_dir = os.path.join(extract_path, MODEL_NAME)
    if os.path.exists(TARGET_DIR):
        shutil.rmtree(TARGET_DIR)

    shutil.move(extracted_dir, TARGET_DIR)
    os.remove(archive_path)

    # Ensure files are world-readable so non-root runner user can load them
    for root, dirs, files in os.walk(TARGET_DIR):
        for d in dirs:
            os.chmod(os.path.join(root, d), 0o755)
        for f in files:
            os.chmod(os.path.join(root, f), 0o644)

    print(f"Offline speech model ready at {TARGET_DIR}", flush=True)


if __name__ == "__main__":
    main()
