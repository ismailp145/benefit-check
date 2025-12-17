export type ResetPeriod = "monthly" | "annually" | "semi-annually";

export type Benefit = {
  id: string;
  name: string;
  totalAmount: number;
  usedAmount: number;
  resetPeriod: ResetPeriod;
  description: string;
  merchantKeywords: string[];
  transactions: { date: string; merchant: string; amount: number }[];
};

export type CardTheme = {
  primary: string;
  secondary: string;
  name: string;
  displayName: string;
};

export type CreditCard = {
  id: string;
  name: string;
  displayName: string;
  issuer: string;
  annualFee: number;
  theme: CardTheme;
  benefits: Omit<Benefit, "usedAmount" | "transactions">[];
};

export const CREDIT_CARDS: Record<string, CreditCard> = {
  amexGold: {
    id: "amexGold",
    name: "gold",
    displayName: "American Express Gold",
    issuer: "American Express",
    annualFee: 325,
    theme: {
      primary: "#000000",
      secondary: "#D4AF37",
      name: "gold",
      displayName: "Gold",
    },
    benefits: [
      {
        id: "dining",
        name: "Dining Credit",
        totalAmount: 10,
        resetPeriod: "monthly",
        description: "Grubhub, Cheesecake Factory, Goldbelly, Wine.com, Five Guys.",
        merchantKeywords: ["grubhub", "cheesecake factory", "goldbelly", "wine.com", "five guys"],
      },
      {
        id: "uber",
        name: "Uber Cash",
        totalAmount: 10,
        resetPeriod: "monthly",
        description: "Uber Eats or Rides (must add card to Uber app).",
        merchantKeywords: ["uber", "uber eats", "uber trip"],
      },
      {
        id: "resy",
        name: "Resy Credit",
        totalAmount: 100,
        resetPeriod: "annually",
        description: "U.S. Resy restaurants (2x $50 credits per year).",
        merchantKeywords: ["resy"],
      },
      {
        id: "dunkin",
        name: "Dunkin' Credit",
        totalAmount: 7,
        resetPeriod: "monthly",
        description: "U.S. Dunkin' locations.",
        merchantKeywords: ["dunkin", "dunkin donuts"],
      },
      {
        id:"hotel",
        name: "The Hotel Collection Credit",
        totalAmount: 100,
        resetPeriod: "annually",
        description: "The Hotel Collection credit for hotel stays.",
        merchantKeywords: ["the hotel collection"],
      },
      {
        id: "other",
        name: "Other Credit",
        totalAmount: 0,
        resetPeriod: "annually",
        description: "Other credit for miscellaneous purchases.",
        merchantKeywords: ["other"],
      }
    ],
  },
  amexPlatinum: {
    id: "amexPlatinum",
    name: "platinum",
    displayName: "American Express Platinum",
    issuer: "American Express",
    annualFee: 895,
    theme: {
      primary: "#000000",
      secondary: "#8B8C89",
      name: "platinum",
      displayName: "Platinum",
    },
    benefits: [
      {
        id: "uber",
        name: "Uber Cash",
        totalAmount: 15,
        resetPeriod: "monthly",
        description: "$15/month Uber Cash ($35 in December).",
        merchantKeywords: ["uber", "uber eats", "uber trip"],
      },
      {
        id: "saks",
        name: "Saks Fifth Avenue",
        totalAmount: 50,
        resetPeriod: "semi-annually",
        description: "$50 statement credit twice per year at Saks.",
        merchantKeywords: ["saks", "saks fifth avenue"],
      },
      {
        id: "airline",
        name: "Airline Fee Credit",
        totalAmount: 200,
        resetPeriod: "annually",
        description: "Airline incidental fees with selected airline.",
        merchantKeywords: ["delta", "united", "american airlines", "southwest", "jetblue", "bag fee", "seat selection"],
      },
      {
        id: "hotel",
        name: "Hotel Credit",
        totalAmount: 200,
        resetPeriod: "annually",
        description: "$200 prepaid hotel credit via Amex Travel.",
        merchantKeywords: ["amex travel", "hotel collection", "fine hotels"],
      },
      {
        id: "entertainment",
        name: "Entertainment Credit",
        totalAmount: 20,
        resetPeriod: "monthly",
        description: "Digital entertainment services (streaming, news, etc).",
        merchantKeywords: ["spotify", "peacock", "audible", "nyt", "new york times", "sirius", "disney+", "hulu"],
      },
      {
        id: "equinox",
        name: "Equinox Credit",
        totalAmount: 25,
        resetPeriod: "monthly",
        description: "Equinox and Equinox+ memberships.",
        merchantKeywords: ["equinox"],
      },
      {
        id: "walmart",
        name: "Walmart+ Credit",
        totalAmount: 12.95,
        resetPeriod: "monthly",
        description: "Walmart+ membership credit.",
        merchantKeywords: ["walmart+", "walmart plus"],
      },
    ],
  },
  chaseSapphireReserve: {
    id: "chaseSapphireReserve",
    name: "sapphire-reserve",
    displayName: "Chase Sapphire Reserve",
    issuer: "Chase",
    annualFee: 795,
    theme: {
      primary: "#000000",
      secondary: "#003DA5",
      name: "sapphire-reserve",
      displayName: "Sapphire Reserve",
    },
    benefits: [
      {
        id: "travel",
        name: "Annual Travel Credit",
        totalAmount: 300,
        resetPeriod: "annually",
        description: "Automatic statement credit for travel purchases.",
        merchantKeywords: ["airline", "hotel", "rental car", "taxi", "uber", "lyft", "parking", "tolls", "train", "cruise"],
      },
      {
        id: "doordash",
        name: "DoorDash DashPass",
        totalAmount: 120,
        resetPeriod: "annually",
        description: "Complimentary DashPass subscription after activation.",
        merchantKeywords: ["doordash", "dashpass"],
      },
      {
        id: "lyft",
        name: "Lyft Credit",
        totalAmount: 10,
        resetPeriod: "monthly",
        description: "$10/month in Lyft ride credits (through March 2025).",
        merchantKeywords: ["lyft"],
      },
    ],
  },
  chaseSapphirePreferred: {
    id: "chaseSapphirePreferred",
    name: "sapphire-preferred",
    displayName: "Chase Sapphire Preferred",
    issuer: "Chase",
    annualFee: 95,
    theme: {
      primary: "#000000",
      secondary: "#003DA5",
      name: "sapphire-preferred",
      displayName: "Sapphire Preferred",
    },
    benefits: [
      {
        id: "doordash",
        name: "DoorDash Benefits",
        totalAmount: 60,
        resetPeriod: "annually",
        description: "Annual DoorDash credits and complimentary DashPass.",
        merchantKeywords: ["doordash", "dashpass"],
      },
    ],
  },
  capitalOneVentureX: {
    id: "capitalOneVentureX",
    name: "venture-x",
    displayName: "Capital One Venture X",
    issuer: "Capital One",
    annualFee: 395,
    theme: {
      primary: "#000000",
      secondary: "#C8102E",
      name: "venture-x",
      displayName: "Venture X",
    },
    benefits: [
      {
        id: "travel",
        name: "Annual Travel Credit",
        totalAmount: 300,
        resetPeriod: "annually",
        description: "Statement credit for travel booked through Capital One Travel.",
        merchantKeywords: ["capital one travel"],
      },
      {
        id: "experienceCredit",
        name: "Experience Credit",
        totalAmount: 100,
        resetPeriod: "annually",
        description: "$100 credit for Capital One Entertainment experiences.",
        merchantKeywords: ["capital one entertainment", "vivid seats"],
      },
      {
        id: "hertz",
        name: "Hertz President's Circle",
        totalAmount: 0,
        resetPeriod: "annually",
        description: "Complimentary Hertz President's Circle status.",
        merchantKeywords: ["hertz"],
      },
    ],
  },
};

export function getCardById(cardId: string): CreditCard | undefined {
  return CREDIT_CARDS[cardId];
}

export function getAllCards(): CreditCard[] {
  return Object.values(CREDIT_CARDS);
}

export function initializeBenefits(card: CreditCard): Benefit[] {
  return card.benefits.map((benefit) => ({
    ...benefit,
    usedAmount: 0,
    transactions: [],
  }));
}

