# Personal Finance Tracker

Cross-platform mobile application for managing personal loans, debts, and financial transactions between individuals — plus a **jar-based budgeting system** inspired by T. Harv Eker's 6-jar method. Built with React Native and Expo, featuring offline-first SQLite storage, WhatsApp integration, and comprehensive analytics.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   React Native (Expo)                     │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Debtor     │  │  Movement    │  │  Stats         │ │
│  │   Manager    │  │  Tracker     │  │  Engine        │ │
│  ├──────────────┤  ├──────────────┤  ├────────────────┤ │
│  │ CRUD ops     │  │ Payments     │  │ Monthly        │ │
│  │ Search &     │  │ Loans        │  │ Daily          │ │
│  │ Filter       │  │ Dual method  │  │ Per-method     │ │
│  │ WhatsApp     │  │ Balance calc │  │ Net flow       │ │
│  └──────────────┘  └──────────────┘  └────────────────┘ │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Jar Groups  │  │   Jars       │  │  Reminders     │ │
│  │  System      │  │   (Frascos)  │  │  & Alerts      │ │
│  ├──────────────┤  ├──────────────┤  ├────────────────┤ │
│  │ Create/Edit  │  │ % allocation │  │ Daily/Weekly/  │ │
│  │ Color & Icon │  │ Goals & budg │  │ Monthly        │ │
│  │ Organize     │  │ Distribution │  │ Custom time    │ │
│  │ Delete       │  │ Transfers    │  │ Push notif.    │ │
│  └──────────────┘  └──────────────┘  └────────────────┘ │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Template    │  │   Backup &   │  │  Contact       │ │
│  │  Editor      │  │   Restore    │  │  Integration   │ │
│  ├──────────────┤  ├──────────────┤  ├────────────────┤ │
│  │ Drag & drop  │  │ JSON export  │  │ WhatsApp       │ │
│  │ Visual vars  │  │ Full restore │  │ Deep link      │ │
│  │ Haptic fb    │  │ Jars + Groups│  │ Templates      │ │
│  └──────────────┘  └──────────────┘  └────────────────┘ │
│                                                           │
│  Storage: SQLite (expo-sqlite) — Offline-first            │
└──────────────────────────────────────────────────────────┘
```

## Features

### Financial Management
- **Debtor profiles** with name, phone, and individual WhatsApp message templates
- **Transaction recording** with dual payment methods (Cash / Transfer)
- **Automatic balance calculation** — real-time balance updates after every movement
- **Transaction types**: Loans given, loans received, payments made, payments received, surcharges
- **Initial balance support** on debtor creation with automatic movement generation
- **Movement deletion** — delete recent movements (within 20 minutes) with automatic balance reversal

### Jar-Based Budgeting System (Frascos)
- **Jar Groups** — organize jars into named groups with custom color and icon
- **Percentage allocation** — assign income percentages per jar; enforced 100% maximum per group
- **Income distribution** — distribute income across jars based on configured percentages
- **Inter-jar transfers** — move funds between any jars with full audit trail
- **Goals** — set savings goals per jar with visual progress tracking
- **Monthly budgets** — set spending limits with usage warnings at 80% and exceeded alerts
- **6-Jar Template** — one-tap setup for T. Harv Eker's method (Needs 55%, Financial Freedom 10%, Education 10%, Fun 10%, Long-term Savings 10%, Donations 5%)
- **Dashboard** — grouped summary view with balance distribution chart, per-group breakdown, and category spending analysis
- **Movement history** — full chronological log with category tags and jar attribution
- **Balance evolution** — visual trend of jar balances over time

### Scheduled Reminders
- **Push notifications** via expo-notifications
- **Frequency options**: Daily / Weekly (Mondays) / Monthly
- **Exact time picker** — select any hour (0–23) and minute (0, 5, 10…55)

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
- **Full JSON export** of all debtors, movements, jar groups, jars, and jar movements
- **File picker restore** with data validation and backward-compatible import
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
| Notifications | expo-notifications |
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
  type TEXT NOT NULL,
  method TEXT NOT NULL,
  description TEXT,
  created_at DATETIME
);

-- App configuration
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Jar groups
CREATE TABLE jar_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#1A237E',
  icon TEXT DEFAULT 'flask-outline',
  created_at DATETIME,
  updated_at DATETIME
);

-- Budget jars
CREATE TABLE jars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  percentage REAL DEFAULT 0,
  color TEXT,
  icon TEXT,
  balance REAL DEFAULT 0,
  goal REAL DEFAULT 0,
  monthly_budget REAL DEFAULT 0,
  group_id INTEGER REFERENCES jar_groups(id),
  created_at DATETIME,
  updated_at DATETIME
);

-- Jar transaction history
CREATE TABLE jar_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jar_id INTEGER REFERENCES jars(id),
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at DATETIME
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
│   └── DatabaseService.js          # SQLite CRUD, stats, backup/restore, jars
└── components/
    ├── DebtorCard.js               # Debtor display with actions & movement deletion
    ├── AddDebtorModal.js           # New debtor form
    ├── AddMovementModal.js         # Transaction recording
    ├── EditDebtorModal.js          # Edit debtor details
    ├── FilterBar.js                # Filter & sort controls
    ├── SearchBar.js                # Name/phone search
    ├── StatsChart.js               # Monthly analytics view
    ├── BackupRestore.js            # JSON export/import (debtors + jars)
    ├── DefaultMessageModal.js      # Global WhatsApp template
    ├── TemplateEditor.js           # Drag-and-drop message builder
    ├── Sidebar.js                  # Side navigation with groups & quick actions
    ├── GroupDetail.js              # Group view with jar listing
    ├── AddGroupModal.js            # Create jar group
    ├── JarDetail.js                # Individual jar view with movements
    ├── AddJarModal.js              # Create jar with % validation
    ├── AddJarMovementModal.js      # Record jar income/expense
    ├── DistributeIncomeModal.js    # Distribute income across jars
    ├── TransferJarModal.js         # Transfer between jars
    ├── JarsDashboard.js            # Grouped summary & charts
    ├── JarsHistory.js              # Full jar movement history
    ├── JarsEvolution.js            # Balance trend over time
    └── ReminderConfig.js           # Push notification scheduling
```

## License

MIT
