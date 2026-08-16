#!/bin/sh
# Disable screen blanking / power management — exams shouldn't sleep mid-session
xset -dpms
xset s off
xset s noblank

# Start openbox in the background to handle window management
openbox &

# Hide cursor when idle
unclutter -idle 1 &

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
  --check-for-update-interval=31536000
