# Milestone 16 — Continuous surah audio

- One audio URL per surah (AlQuran Cloud CDN edition streams), not per ayah. Verify individual reciter editions/streams on a physical device.
- Expo Audio background playback configured; iOS lock-screen/Control Center metadata and Android media notification require native build configuration. Expo Go may not reflect background capabilities.
- Seek ±15 seconds, repeat whole surah, save favorite reciter.
- Listening analytics uses player playback position, including time elapsed while JS was suspended and then resumed. Does not count screen-open time. A native background service would be required for guaranteed real-time analytics persistence if the OS terminates the process.
- This does not create an always-on-top floating video/PiP window: iOS provides native media controls, not arbitrary app overlay.
