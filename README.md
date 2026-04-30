# Folkhart Frontend

Frontend client for Folkhart - An idle RPG game with crafting, dungeons, and character progression.

## Tech Stack

- **React** + **TypeScript**
- **Vite** - Build tool
- **TanStack Query** - Data fetching & caching
- **Zustand** - State management
- **TailwindCSS** - Styling
- **Lucide React** - Icons

## Features

- 🎨 Retro pixel-art aesthetic
- 📱 Mobile-responsive design
- 🎮 5 playable classes with unique equipment
- ⚔️ Equipment system with visual enhancement levels (+1 to +9)
- 💎 Socket system with gem display
- 🏰 Dungeon exploration (idle & active modes)
- 🔨 Blacksmith for enhancement, refining, and socketing
- 🛒 Personal shop with daily gem rewards
- 🏆 Achievement system with titles
- 👥 Guild management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (`.env`):
```env
VITE_API_URL=http://localhost:3000/api
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── tabs/          # Main game tabs
│   ├── TopBar.tsx     # Header with player info
│   └── BottomNav.tsx  # Navigation bar
├── lib/
│   └── api.ts         # API client
├── store/
│   └── gameStore.ts   # Global state
├── utils/
│   └── format.ts      # Formatting helpers
└── assets/
    └── items/         # Item sprites
```

## Key Components

- **VillageTab** - Equipment management
- **AdventureTab** - Dungeon exploration & idle farming
- **BlacksmithTab** - Enhancement, refining, socketing
- **ShopTab** - Item purchasing
- **GuildTab** - Guild features

## License

MIT
