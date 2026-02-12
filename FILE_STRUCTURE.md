# 📂 File Structure Documentation

## Project Root

```
car/
├── src/                          # Source code
├── public/                       # Static files
├── node_modules/                 # Dependencies (after npm install)
├── .next/                        # Build output (generated)
│
├── package.json                  # Dependencies & scripts
├── package-lock.json             # Lock file
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS config
├── postcss.config.js             # PostCSS config
├── next.config.js                # Next.js config
├── .eslintrc.json                # ESLint config
├── .gitignore                    # Git ignore rules
├── .env.example                  # Environment variables template
│
├── README.md                     # Main documentation
├── SETUP.md                      # Setup guide
├── DEVELOPMENT.md                # Development guide
├── QUICK_REFERENCE.md            # Quick reference
├── PROJECT_SUMMARY.md            # Project summary
├── CHECKLIST.md                  # Tasks & checklist
└── FILE_STRUCTURE.md             # This file
```

## Source Code Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── page.tsx                  # Home page (/)
│   │
│   ├── (marketing)/
│   │   ├── raffles/
│   │   │   ├── page.tsx          # List raffles
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Raffle details
│   │   │
│   │   ├── wallet/
│   │   │   └── page.tsx          # Wallet page
│   │   │
│   │   ├── wheel/
│   │   │   └── page.tsx          # Wheel game
│   │   │
│   │   ├── slide/
│   │   │   └── page.tsx          # Slide game
│   │   │
│   │   ├── profile/
│   │   │   └── page.tsx          # User profile
│   │   │
│   │   ├── fairness/
│   │   │   └── page.tsx          # Fairness page
│   │   │
│   │   ├── blog/
│   │   │   └── page.tsx          # Blog list
│   │   │
│   │   ├── auction/
│   │   │   └── page.tsx          # Auction page
│   │   │
│   │   ├── loan/
│   │   │   └── page.tsx          # Car loan page
│   │   │
│   │   └── checks/
│   │       └── page.tsx          # Check purchase page
│   │
│   └── admin/                    # Admin panel
│       ├── layout.tsx            # Admin layout
│       │
│       ├── dashboard/
│       │   └── page.tsx          # Admin dashboard
│       │
│       ├── raffles/
│       │   └── page.tsx          # Raffle management
│       │
│       ├── users/
│       │   └── page.tsx          # User management
│       │
│       ├── finance/
│       │   └── page.tsx          # Finance management
│       │
│       ├── pricing/
│       │   └── page.tsx          # Pricing config
│       │
│       ├── wheel/
│       │   └── page.tsx          # Wheel config
│       │
│       ├── rewards/
│       │   └── page.tsx          # Rewards management
│       │
│       ├── live/
│       │   └── page.tsx          # Live control
│       │
│       ├── content/
│       │   └── page.tsx          # Content management
│       │
│       └── audit/
│           └── page.tsx          # Audit logs
│
├── components/                   # Reusable components
│   ├── layout/
│   │   ├── header.tsx            # Header component
│   │   └── footer.tsx            # Footer component
│   │
│   └── providers.tsx             # App providers
│
├── lib/                          # Utility functions (ready for)
│   └── (to be created)
│
├── hooks/                        # Custom hooks (ready for)
│   └── (to be created)
│
├── stores/                       # State management (optional)
│   └── (to be created)
│
└── types/                        # TypeScript types (ready for)
    └── (to be created)
```

## File Details

### Core Files

#### `src/app/layout.tsx`
- Root layout component
- HTML document structure
- Providers wrapper
- Global scripts

#### `src/app/globals.css`
- CSS Variables
- Global styles
- Tailwind directives
- Custom utilities

#### `src/app/page.tsx`
- Home page
- 9 immersive sections
- Scroll snap design
- Hero section

### Components

#### `src/components/layout/header.tsx`
- Sticky header
- Navigation menu
- Logo
- User section
- Mobile hamburger menu

#### `src/components/layout/footer.tsx`
- Footer links
- Contact info
- Social links
- Copyright

#### `src/components/providers.tsx`
- Toast notifications setup
- Theme provider
- Auth provider (ready)

### Pages Structure

#### User Pages
Each page follows this structure:
```
page.tsx
├── "use client" directive
├── Imports (motion, hooks, etc.)
├── Page component
│   ├── main element with min-h-screen
│   ├── max-w-6xl container
│   ├── Content sections
│   └── Animation wrappers
└── Export default
```

#### Admin Pages
Similar structure but with:
- Sidebar navigation
- Admin-specific components
- Data tables
- Forms

### Configuration Files

#### `tsconfig.json`
- TypeScript settings
- Path aliases (@/*)
- Strict mode enabled

#### `tailwind.config.ts`
- Color palette
- Font families
- Custom animations
- Breakpoints

#### `next.config.js`
- React strict mode
- Internationalization
- Image optimization

#### `postcss.config.js`
- Tailwind CSS
- Autoprefixer

### Documentation Files

#### `README.md`
- Project overview
- Features
- Technologies
- Getting started

#### `SETUP.md`
- Installation steps
- Environment setup
- Troubleshooting

#### `DEVELOPMENT.md`
- Component examples
- CSS utilities
- API structure
- Best practices

#### `PROJECT_SUMMARY.md`
- Detailed overview
- Page descriptions
- Statistics

#### `QUICK_REFERENCE.md`
- Quick commands
- Component snippets
- Common patterns

#### `CHECKLIST.md`
- Task lists
- Development phases
- Timeline

## File Types

| Type | Count | Location |
|------|-------|----------|
| .tsx | 25+ | src/app/ |
| .ts | 3 | Root config |
| .css | 1 | src/app/ |
| .json | 5 | Root |
| .js | 2 | Root |
| .md | 6 | Root |

## Key Directories

### `/src/app`
Contains all Next.js pages and layouts using App Router

### `/src/components`
Reusable React components (Header, Footer)

### `/src` (Ready for)
- `/lib` - Utility functions
- `/hooks` - Custom React hooks
- `/stores` - Zustand stores
- `/types` - TypeScript types

### Root
Configuration and documentation files

## Naming Conventions

```
Files:           kebab-case.tsx
Folders:         kebab-case/
Functions:       camelCase()
Components:      PascalCase
CSS Classes:     kebab-case
Variables:       camelCase
Constants:       UPPER_SNAKE_CASE
```

## File Organization Rules

1. **One responsibility per file**
2. **Related files grouped in folders**
3. **Shared components in components/**
4. **Page-specific content in page folder**
5. **Styles next to components**

## Import Paths

```tsx
// Absolute imports (configured in tsconfig)
import { Header } from "@/components/layout/header"
import toast from "react-hot-toast"

// Relative imports (when necessary)
import { config } from "./config"
```

## Build Output

After `npm run build`:

```
.next/
├── cache/
├── static/
│   ├── chunks/
│   │   ├── app/
│   │   ├── pages/
│   │   └── main.js
│   ├── css/
│   └── media/
└── server/
    └── app/
```

## Ignored Files

Specified in `.gitignore`:
```
node_modules/
.next/
dist/
build/
*.log
.env
.env.local
.DS_Store
```

## Environment Variables

Stored in `.env.local` (not committed):

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=
DATABASE_URL=
PAYMENT_GATEWAY_KEY=
EMAIL_SERVICE=
```

Template in `.env.example`

## File Size Reference

- Home page: ~25KB (minified)
- Admin dashboard: ~20KB (minified)
- Component: 1-5KB each
- CSS (Tailwind): ~50KB (minified)
- JS bundle: ~200KB (with dependencies)

## Static Files

Place in `public/`:
```
public/
├── favicon.ico
├── images/
├── icons/
└── fonts/
```

Reference: `/image.jpg`

---

**Total Files**: 40+  
**Total Lines of Code**: 5000+  
**Languages**: TypeScript, CSS, Markdown  
**Framework**: Next.js 14  

**Status**: Frontend complete ✅  
**Next**: Backend development 📝
