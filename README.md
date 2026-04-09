# Personal Finance Tracker

Cross-platform mobile application for managing personal loans, debts, and financial transactions between individuals. Built with React Native and Expo, featuring offline-first SQLite storage, WhatsApp integration, and comprehensive analytics.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Native (Expo)                 │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Debtor     │  │  Movement    │  │  Stats    │ │
│  │   Manager    │  │  Tracker     │  │  Engine   │ │
│  ├──────────────┤  ├──────────────┤  ├───────────┤ │
│  │ CRUD ops     │  │ Payments     │  │ Monthly   │ │
│  │ Search &     │  │ Loans        │  │ Daily     │ │
│  │ Filter       │  │ Dual method  │  │ Per-method│ │
│  │ WhatsApp     │  │ Balance calc │  │ Net flow  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Template    │  │   Backup &   │  │  Contact  │ │
│  │  Editor      │  │   Restore    │  │  Integr.  │ │
│  ├──────────────┤  ├──────────────┤  ├───────────┤ │
│  │ Drag & drop  │  │ JSON export  │  │ WhatsApp  │ │
│  │ Visual vars  │  │ Full restore │  │ Deep link │ │
│  │ Haptic fb    │  │ File picker  │  │ Templates │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│                                                      │
│  Storage: SQLite (expo-sqlite) — Offline-first       │
└─────────────────────────────────────────────────────┘
```

## Features

### Financial Management
- **Debtor profiles** with name, phone, and individual WhatsApp message templates
- **Transaction recording** with dual payment methods (Cash / Transfer)
- **Automatic balance calculation** — real-time balance updates after every movement
- **Transaction types**: Loans given, loans received, payments made, payments received, surcharges
- **Initial balance support** on debtor creation with automatic movement generation

### Analytics Dashboard
- **Monthly breakdown** with navigation between months
- **Daily grouping** — transactions organized by weekday and date
- **Method-level stats** — separate tracking for Cash vs Transfer flows
- **Net balance indicators** — visual "In your favor" / "Against you" badges
- **Per-transaction detail** — amount, type, method, time, description

### Search & Filtering
- **Real-time search** by name or phone number
- **Filter by status**: All / Owe me / I owe
- **Sort options**: Recent / Highest debt / Lowest debt / Alphabetical
- **Pull-to-refresh** for data reload

### WhatsApp Integration
- **One-tap messaging** with deep linking to WhatsApp
- **Template variables**: `{name}` and `{balance}` auto-replaced
- **Per-debtor custom messages** or global default template
- **Visual template editor** with drag-and-drop variable positioning and haptic feedback

### Backup & Restore
- **Full JSON export** of all debtors, movements, and settings
- **File picker restore** with data validation
- **Metadata tracking** — backup version, timestamp, app identifier
- **Share functionality** via native share sheet

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81, Expo SDK 54 |
| Database | SQLite (expo-sqlite) |
| UI | Custom components, Ionicons |
| Gestures | PanResponder, Animated API |
| Storage | expo-file-system, StorageAccessFramework |
| Integrations | expo-contacts, expo-sharing, expo-haptics |
| Timezone | America/Havana (localized timestamps) |

## Database Schema

```sql
-- Debtor profiles
CREATE TABLE debtors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  balance REAL DEFAULT 0,
  whatsapp_message TEXT,
  created_at DATETIME,
  updated_at DATETIME
);

-- Transaction history
CREATE TABLE movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  debtor_id INTEGER REFERENCES debtors(id),
  amount REAL NOT NULL,
  type TEXT NOT NULL,        -- "Me pagó", "Le pagué", etc.
  method TEXT NOT NULL,      -- "Efectivo" | "Transferencia"
  description TEXT,
  created_at DATETIME
);

-- App configuration
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

## Setup

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android
npm run android
```

## Project Structure

```
src/
├── services/
│   └── DatabaseService.js     # SQLite CRUD, stats, backup/restore
└── components/
    ├── DebtorCard.js          # Debtor display with actions
    ├── AddDebtorModal.js      # New debtor form
    ├── AddMovementModal.js    # Transaction recording
    ├── EditDebtorModal.js     # Edit debtor details
    ├── FilterBar.js           # Filter & sort controls
    ├── SearchBar.js           # Name/phone search
    ├── StatsChart.js          # Monthly analytics view
    ├── BackupRestore.js       # JSON export/import
    ├── DefaultMessageModal.js # Global WhatsApp template
    └── TemplateEditor.js      # Drag-and-drop message builder
```

## License

MIT
