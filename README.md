# ✦ PruvYou

**Prove yourself, every day.** A habit tracking app built with **Expo** (React Native).

## Features

- ✅ **7 Day Cards** — weekly view with vertical progress bars and percentage
- 📋 **Habit management** — checkbox or timer, daily/weekly, categories with custom icons
- 📊 **Statistics** — 30-day charts, per-habit rates, current streaks
- 📄 **Excel Report** — annual export with 13 sheets (summary + 12 months)
- 🏷 **Categories** — 8 standard + custom categories with image upload
- 💾 **Persistence** — local data with AsyncStorage
- 🌙 **Dark theme** — brand colors #1A4F8A #34C79F #F7C602

## Setup

```bash
npm install
npx expo start
npx expo start --android
```

## Build APK

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

## Brand Colors

| Role | Color | Hex |
|------|-------|-----|
| Primary | Deep Blue | `#1A4F8A` |
| Success | Teal Green | `#34C79F` |
| Accent | Vibrant Gold | `#F7C602` |
