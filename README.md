# ✦ PruvYou

**Prove yourself, every day.** Aplicație de tracking obiceiuri zilnice și săptămânale, construită cu **Expo** (React Native).

## Features

- ✅ **7 Day Cards** — vizualizare săptămânală cu progress bar vertical și procentaj
- 📋 **Creare obiceiuri** — checkbox sau timer, zilnic/săptămânal, icon & culoare
- 📊 **Statistici** — grafice pe 30 zile, rate per obicei, serii (streaks)
- 📄 **Raport Excel** — export anual cu 13 sheet-uri (sumar + 12 luni)
- 💾 **Persistență** — datele se salvează local cu AsyncStorage
- 🌙 **Dark theme** — paletă caldă cu accente gold

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

## Project Structure

```
pruvyou/
├── app/
│   ├── _layout.tsx
│   └── (tabs)/
│       ├── _layout.tsx      # Tab navigator
│       ├── index.tsx        # Home — 7 day cards + daily checklist
│       ├── habits.tsx       # Habit management (CRUD)
│       ├── stats.tsx        # Statistics & charts
│       └── report.tsx       # Report & Excel export
├── components/
│   ├── DayCard.tsx          # Vertical progress bar card
│   └── HabitForm.tsx        # Create/edit habit form
├── hooks/
│   └── useHabits.ts         # State management hook
├── utils/
│   ├── storage.ts           # AsyncStorage wrapper
│   ├── dates.ts             # Date helpers
│   └── types.ts             # TypeScript types
├── constants/
│   └── theme.ts             # Colors, palette, icons
└── assets/
```

## Design

- **Background**: `#1a1714` (warm dark)
- **Cards**: `#222018`
- **Gold accent**: `#d4a574`
- **Completion**: verde `#7BC9A0` | galben `#E8C96B` | portocaliu `#E8956B`
