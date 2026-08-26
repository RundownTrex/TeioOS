#!/bin/sh
# ============================================================================
# TeioOS Kiosk X Session Initialization (.xinitrc)
# ============================================================================
# This script runs as examuser after startx is invoked from .bash_profile.
# It configures the accessibility stack (D-Bus, AT-SPI2, Orca, PulseAudio),
# launches the Openbox window manager, and opens Chromium in kiosk mode
# pointed at the TeioOS exam server.
# ============================================================================

# ── 1. Disable Screen Blanking & Power Management ──
# Exams should never trigger sleep or screen blanking mid-session.
xset -dpms
xset s off
xset s noblank

# ── 2. Accessibility Environment Variables ──
# These must be set BEFORE any GTK/AT-SPI application launches so the
# accessibility bus is initialized and toolkit bridges are loaded.
export GTK_MODULES="gail:atk-bridge"
export QT_ACCESSIBILITY=1
export NO_AT_BRIDGE=0
export ACCESSIBILITY_ENABLED=1
export GNOME_ACCESSIBILITY=1

# ── 3. D-Bus Session Bus ──
# Required by AT-SPI2, Orca, and PulseAudio. When launched via startx
# (no display manager), the D-Bus session bus is not yet running.
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
    eval $(dbus-launch --sh-syntax --exit-with-session)
    export DBUS_SESSION_BUS_ADDRESS
fi

# ── 4. AT-SPI2 Accessibility Registry ──
# The AT-SPI2 bus launcher creates the accessibility bus that Orca and
# Chromium use to communicate. Launch it early so it is ready before
# the browser and screen reader start.
if [ -x /usr/libexec/at-spi-bus-launcher ]; then
    /usr/libexec/at-spi-bus-launcher --launch-immediately &
elif [ -x /usr/lib/at-spi2-core/at-spi-bus-launcher ]; then
    /usr/lib/at-spi2-core/at-spi-bus-launcher --launch-immediately &
fi

if [ -x /usr/libexec/at-spi2-registryd ]; then
    /usr/libexec/at-spi2-registryd &
elif [ -x /usr/lib/at-spi2-core/at-spi2-registryd ]; then
    /usr/lib/at-spi2-core/at-spi2-registryd &
fi

# ── 5. Audio Subsystem (PulseAudio + ALSA) ──
# Start PulseAudio and unmute all audio channels so TTS/STT and Orca
# speech output works immediately.
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

# ── 6. Speech Dispatcher Daemon ──
# Provides the speech synthesis backend (espeak-ng) used by Orca.
speech-dispatcher -d 2>/dev/null || true

# Brief pause to let PulseAudio, AT-SPI2, and speech-dispatcher settle
sleep 1

# ── 7. Openbox Window Manager ──
# Start the minimal window manager. It provides the keybinding layer
# (rc.xml) that blocks dangerous shortcuts and maps the Orca toggle.
openbox --config-file /etc/xdg/openbox/rc.xml &

# ── 8. Hide Mouse Cursor When Idle ──
unclutter -idle 1 &

# ── 9. Orca Screen Reader (Enabled by Default) ──
# Orca is launched automatically so blind candidates hear speech output
# from the moment the kiosk boots without requiring sighted assistance.
# Sighted candidates or invigilators can toggle it off at any time with
# Alt+Super+S (mapped in Openbox rc.xml -> teioos-toggle-orca).
if command -v orca >/dev/null 2>&1; then
    orca --replace &
fi

# Brief pause to let Orca initialize before launching the browser
sleep 1

# ── 10. Chromium Kiosk Browser ──
# Launch Chromium in fullscreen kiosk mode with accessibility flags:
#   --force-renderer-accessibility : Forces the accessibility tree to be
#       built even without a detected screen reader, ensuring AT-SPI2
#       works reliably with Orca from the first page load.
#   --enable-speech-dispatcher : Enables speech-dispatcher integration
#       for Web Speech API voices on Linux.
#   --autoplay-policy=no-user-gesture-required : Allows TTS utterances
#       and audio feedback without requiring a user click first.
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
