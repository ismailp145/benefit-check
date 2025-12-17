# Benefit Tracker

A frontend-only web application that helps credit card users analyze their annual benefit usage and compare it against their card's annual fee. Upload your credit card statements and see exactly how much value you're capturing from your card benefits.

## Features

- **Multi-Card Support**: Analyze benefits for multiple premium credit cards:
  - American Express Gold
  - American Express Platinum
  - Chase Sapphire Reserve
  - Chase Sapphire Preferred
  - Capital One Venture X

- **Dynamic Theming**: Each card has its own color theme that changes when you switch cards

- **Multi-File Upload**: Upload a full year's worth of statements (12+ files) at once

- **Smart Parsing**: Automatically identifies benefit-eligible transactions from your statements

- **PDF Reports**: Download a professional PDF summary of your benefit analysis

- **Privacy First**: All processing happens in your browser - no data is sent to any server

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

The built files will be in `dist/public/`.

## Deployment to Vercel

This project is configured for easy deployment to Vercel:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project in Vercel
3. Vercel will automatically detect the configuration from `vercel.json`
4. Deploy!

Alternatively, use the Vercel CLI:

```bash
npm install -g vercel
vercel
```

## How to Use

1. **Select Your Card**: Click the card button in the header to choose your credit card
2. **Upload Statements**: Upload CSV or Excel files of your credit card statements (you can upload multiple files at once)
3. **Analyze**: Click "Analyze Spend" to process your transactions
4. **Review Results**: See which benefits you've used and how much value you've captured
5. **Download Report**: Generate a PDF summary for your records

## Supported File Formats

- CSV (.csv)
- Excel (.xls, .xlsx)

## Privacy & Security

- **No Backend**: All processing happens in your browser using JavaScript
- **No Data Storage**: No data is saved, uploaded, or transmitted to any server
- **No Tracking**: No analytics or tracking cookies

## Technology Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS (Brutalist design system)
- **File Parsing**: SheetJS (xlsx)
- **PDF Generation**: @react-pdf/renderer
- **Animations**: Framer Motion
- **Build Tool**: Vite
- **Deployment**: Vercel

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── lib/           # Utilities and configurations
│   │   │   ├── cards.ts   # Card definitions and benefits
│   │   │   ├── parser.ts  # Statement parsing logic
│   │   │   └── theme.ts   # Dynamic theming
│   │   └── pages/         # Page components
│   └── index.html
├── vercel.json            # Vercel deployment config
└── package.json
```

## Adding New Cards

To add support for a new credit card:

1. Open `client/src/lib/cards.ts`
2. Add a new card definition to the `CREDIT_CARDS` object
3. Include:
   - Card metadata (name, issuer, annual fee)
   - Theme colors
   - List of benefits with merchant keywords

Example:

```typescript
newCard: {
  id: "newCard",
  name: "new-card",
  displayName: "New Card Name",
  issuer: "Bank Name",
  annualFee: 95,
  theme: {
    primary: "#000000",
    secondary: "#FF0000",
    name: "new-card",
    displayName: "New Card",
  },
  benefits: [
    {
      id: "benefit1",
      name: "Benefit Name",
      totalAmount: 100,
      resetPeriod: "annually",
      description: "Benefit description",
      merchantKeywords: ["merchant1", "merchant2"],
    },
  ],
}
```

## License

MIT

## Disclaimer

This application is not affiliated with or endorsed by American Express, Chase, Capital One, or any other financial institution. All trademarks are property of their respective owners.

