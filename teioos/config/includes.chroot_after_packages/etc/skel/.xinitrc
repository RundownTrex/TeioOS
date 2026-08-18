#!/bin/sh
# Disable screen blanking / power management — exams shouldn't sleep mid-session
xset -dpms
xset s off
xset s noblank

# Start openbox in the background to handle window management
openbox --config-file /etc/xdg/openbox/rc.xml &

# Hide cursor when idle
unclutter -idle 1 &

# Initialize sound subsystem (PulseAudio + ALSA volume unmuting for TTS/STT)
pulseaudio --start --exit-idle-time=-1 2>/dev/null || true
amixer sset Master unmute 2>/dev/null || true
amixer sset Master 100% 2>/dev/null || true
amixer sset Speaker unmute 2>/dev/null || true
amixer sset Headphone unmute 2>/dev/null || true
amixer sset PCM 100% 2>/dev/null || true
amixer sset PCM unmute 2>/dev/null || true
amixer sset Capture unmute 2>/dev/null || true
amixer sset Capture 100% 2>/dev/null || true
amixer sset Mic unmute 2>/dev/null || true
amixer sset Mic 100% 2>/dev/null || true

# Enable AT-SPI2 accessibility infrastructure for screen readers
export ACCESSIBILITY_ENABLED=1
export GNOME_ACCESSIBILITY=1
export NO_AT_BRIDGE=0

# Start speech dispatcher daemon for speech synthesis
speech-dispatcher -d 2>/dev/null || true

# Launch Chromium in locked-down kiosk mode
exec chromium \
  --kiosk "http://teioos-server.local:8080/exam/login/" \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --incognito \
  --no-first-run \
  --disable-translate \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --enable-speech-dispatcher \
  --force-renderer-accessibility \
  --use-fake-ui-for-media-stream \
  --check-for-update-interval=31536000 \
  --disable-context-menu
