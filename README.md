# ORBIT — South African Youth Career Discovery Platform

> *"Map your move."*  
> *"More than an opportunity. A way forward."*

**ORBIT** is a futurist digital career-discovery platform designed specifically for South African youth.

ORBIT is **NOT** a job board, a government portal, or a standard questionnaire. It is a **Personal Possibility Map** that solves a critical challenge: young people do not know which pathways connect their current situation, skills, and curiosity to real opportunities.

---

## 🌟 The Core Experience

> **"START WHERE YOU ARE — THEN SEE WHERE YOU COULD GO."**

ORBIT starts by asking about your *current situation* (studying, fresh out of matric, graduate, casual experience, or completely unsure) and what resources you have on hand. It then generates a visual, branching **Possibility Map** showing how learning, building, and working converge into future careers.

- **"SHOW ME ANOTHER FUTURE →"**: Regenerates alternate valid pathways from the same starting coordinates.
- **"I HAVE NO IDEA WHAT I WANT TO DO"**: A judgement-free, visual this-or-that discovery flow for young people experiencing career paralysis.
- **"My Possibility DNA"**: Visual archetype profile card mapping strengths across Tech, Creative, Commercial, Leadership, and Community.
- **"My Route" Progress Tracker**: Step-by-step milestone tracker (persisted via `localStorage`).
- **Opportunity Safety Check**: Real vs. Red Flag scam awareness educating South African youth on application fraud.

---

## 🚀 How to Run Locally

Because ORBIT dynamically queries `data/opportunities.json`, browsers require a local HTTP server (to prevent CORS restrictions on `file:///` protocols):

### Option 1: Python (Built-in on macOS, Linux, and Windows)
Open your terminal in the `ORBIT` folder and run:
```bash
python3 -m http.server 8000
# or on Windows:
python -m http.server 8000
```
Then navigate to: **`http://localhost:8000`**

### Option 2: VS Code Live Server
1. Open the project in VS Code.
2. Right-click `index.html` and select **"Open with Live Server"**.

### Option 3: Node / npx (Zero install)
```bash
npx serve .
```

---

## 📂 File Structure

```
ORBIT/
├── index.html                  # Futuristic homepage with Possibility Map preview & Discovery Engine
├── discover.html               # "Start Where You Are" onboarding, Possibility Map & live coordinates
├── no-idea.html                # Dedicated "I Have No Idea" polar choice instinct quiz & starter matches
├── opportunities.html          # Full search, filters & "For My Situation" switcher
├── opportunity.html            # Editorial detail page (?id=...) with document checklist & safety check
├── resources.html              # Career Signal digital magazine & Career Toolkit playbooks
├── saved.html                  # My Route milestone tracker & Opportunity Passport achievements
├── contact.html                # Ecosystem partnership & youth contact form
├── data/
│   └── opportunities.json      # 26 vetted demo opportunities with metadata & situation tags
├── css/
│   └── styles.css              # Custom African-futurist styling, dark/light theme, zero-pill metadata
├── js/
│   ├── data.js                 # JSON fetching, caching, city statistics & daily hash
│   ├── storage.js              # LocalStorage manager for bookmarks, user accounts, checklist & passport
│   ├── render.js               # Editorial card rendering, countdown timers & empty states
│   ├── filters.js              # Live multi-parameter filtering & aria-live announcements
│   ├── details.js              # Detail page layout, document checklist & sharing
│   ├── forms.js                # Accessible client-side contact validation
│   ├── discover.js             # SVG Possibility Map generation & DNA calculation
│   └── main.js                 # Global navigation, theme toggle, Ask ORBIT assistant & modals
├── assets/
│   ├── images/
│   │   ├── hero.svg            # African-futurist vector constellation artwork
│   │   └── placeholder.svg     # Abstract geometric placeholder asset
│   └── icons/
│       └── favicon.svg         # Geometric unity emblem favicon
├── README.md                   # Project documentation & execution guide
└── .gitignore                  # Git exclusions
```

---

## ⚡ Key Features

1. **"Start Where You Are" Onboarding**: 4-step progressive disclosure starting with current reality.
2. **SVG Possibility Map**: Branching geometry with animated path strokes (`YOU → LEARN / BUILD / WORK → FUTURE`).
3. **Alternate Futures Engine**: Recompute new valid futures with one click.
4. **Possibility DNA Profile**: Exploratory strength breakdown with mandatory non-deterministic disclaimer.
5. **Meet Your Possible Futures**: Dossiers for The Builder, The Creator, The Entrepreneur, and The Systems Specialist.
6. **"I Have No Idea" Mode**: Visual this-or-that choice engine on a dedicated page (`no-idea.html`).
7. **"For My Situation" Filter Bar**: Direct filtering for Matric learners, TVET students, graduates, and entrepreneurs.
8. **Live Countdown Timers**: Tabular countdown per listing (`04 DAYS · 12 HRS · 28 MIN`).
9. **Opportunity Safety Check ("Real Or Red Flag?")**: Scam prevention guidelines on every listing.
10. **"From My City" Landscape**: Real live opportunity counts across 10 South African metros.
11. **Career Signal Magazine**: 4 in-depth contextual articles on skills, portfolios, learnerships, and CVs.
12. **Career Toolkit**: Accessible interactive modals for CV, Interview, Portfolio, and LinkedIn prep.
13. **Ask ORBIT Assistant**: Rule-based keyword parser offering instant contextual recommendations.
14. **Opportunity Passport**: Light, tasteful achievement badges unlocked as users take action.
15. **User Profiles & Isolated Dossiers**: Sign up/sign in, avatar pills, and personal opportunity dossiers.
16. **Dark & Light Mode**: Accessible, persistent high-contrast themes.

---

## ♿ Accessibility & Design Discipline

- **WCAG AA Compliance**: High-contrast ratios, visible focus states, and text scaling.
- **Zero-Pill Metadata**: Metadata rendered as clean unboxed text with typographic `·` separators.
- **Screen Reader Announcements**: Live search result counts announced via `aria-live="polite"`.
- **Keyboard Navigation**: Skip-to-content link, modal focus trapping, and ESC key handlers.
- **Motion Restraint**: Full support for `prefers-reduced-motion`.

---

## 📜 Demo Data & Responsible Labelling

This application is an editorial portfolio and design proof-of-concept:
- Every fictional listing is explicitly badged with **DEMO LISTING**.
- Application URLs route to verified demo domains (`example.com` or safe internal IDs).
- No deceptive links or fee demands are ever presented.

---

## 📦 How to Reconstruct ORBIT.zip

To package the entire project into a single `ORBIT.zip` file, run one of the following commands from the project parent directory:

### Python (Cross-Platform):
```bash
python3 -c "import shutil; shutil.make_archive('ORBIT', 'zip', '.')"
```

### macOS / Linux (Bash):
```bash
zip -r ORBIT.zip . -x "node_modules/*" ".git/*" "dist/*"
```

### Windows (PowerShell):
```powershell
Compress-Archive -Path * -DestinationPath ORBIT.zip -Force
```

---

*Designed & Engineered for South African Youth Mobility · 2026*
