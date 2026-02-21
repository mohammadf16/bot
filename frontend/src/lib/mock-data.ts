// Mock data for testing - no backend required
export const MOCK_TEST_CREDENTIALS = {
  admin: {
    email: "admin@demo.local",
    password: "Admin@123456",
  },
  user: {
    email: "user@demo.local",
    password: "User@123456",
  },
}

export const MOCK_USER = {
  id: "user-123",
  email: MOCK_TEST_CREDENTIALS.user.email,
  role: "user" as const,
  walletBalance: 5000000,
  goldSotBalance: 1500,
  chances: 25,
  vipLevelId: 2,
  vipLevelName: "Gold",
  vipCashbackPercent: 5,
  totalTicketsBought: 150,
  totalSpendIrr: 50000000,
  activeReferrals: 12,
  loanLockedBalance: 0,
  referralCode: "USER123CODE",
  profile: {
    fullName: "Ø¹Ù„ÛŒ Ø§Ø­Ù…Ø¯ÛŒ",
    username: "aliahmadi",
    phone: "+98 910 123 4567",
    city: "ØªÙ‡Ø±Ø§Ù†",
    address: "Ø®ÛŒØ§Ø¨Ø§Ù† ÙˆÙ„ÛŒØ¹ØµØ±ØŒ Ù¾Ù„Ø§Ú© 123",
    bio: "Ø¹Ù„Ø§Ù‚Ù…Ù†Ø¯ Ø¨Ù‡ Ù‚Ø±Ø¹Ù‡ Ú©Ø´ÛŒ Ùˆ Ø¨Ø§Ø²ÛŒ Ù‡Ø§ÛŒ Ø¢Ù†Ù„Ø§ÛŒÙ†",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
  },
  notificationPrefs: {
    email: true,
    sms: true,
    push: true,
  },
}

export const MOCK_ADMIN_USER = {
  ...MOCK_USER,
  id: "admin-1",
  email: MOCK_TEST_CREDENTIALS.admin.email,
  role: "admin" as const,
}

export const MOCK_VEHICLES = [
  {
    id: "vehicle-1",
    sourceType: "lottery_winback" as const,
    status: "available" as const,
    vehicle: {
      title: "BMW M440i xDrive",
      imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200",
      description: "Ø®ÙˆØ¯Ø±ÙˆÛŒ Ù„ÙˆÚ©Ø³ Ùˆ Ù…Ø¯Ø±Ù†",
    },
    listedPriceIrr: 3500000000,
    listedPriceGoldSot: 850000,
  },
  {
    id: "vehicle-2",
    sourceType: "external_purchase" as const,
    status: "available" as const,
    vehicle: {
      title: "Mercedes-Benz C300",
      imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200",
      description: "Ø®ÙˆØ¯Ø±ÙˆÛŒ Ù…Ø±Ø³Ø¯Ø³ Ø¨Ù†Ø²",
    },
    listedPriceIrr: 2800000000,
    listedPriceGoldSot: 680000,
  },
  {
    id: "vehicle-3",
    sourceType: "lottery_winback" as const,
    status: "available" as const,
    vehicle: {
      title: "Audi A4",
      imageUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000",
      description: "Ø®ÙˆØ¯Ø±ÙˆÛŒ Ø¢Ø¦ÙˆØ¯ÛŒ",
    },
    listedPriceIrr: 2200000000,
    listedPriceGoldSot: 530000,
  },
]

export const MOCK_RAFFLES = [
  {
    id: "raffle-1",
    title: "قرعه‌کشی فراری",
    status: "open" as const,
    maxTickets: 10000,
    ticketsSold: 7250,
    seedCommitHash: "0x1234567890abcdef",
    dynamicPricing: {
      basePrice: 50000,
      decayFactor: 0.98,
      minPrice: 30000,
    },
    comboPackages: [
      {
        code: "silver" as const,
        title: "بسته نقره‌ای",
        paidTickets: 50,
        bonusTickets: 10,
        bonusChances: 5,
        vipDays: 7,
      },
      {
        code: "gold" as const,
        title: "بسته طلایی",
        paidTickets: 100,
        bonusTickets: 30,
        bonusChances: 15,
        vipDays: 30,
      },
    ],
  },
  {
    id: "raffle-2",
    title: "قرعه‌کشی لامبورگینی",
    status: "open" as const,
    maxTickets: 5000,
    ticketsSold: 3100,
    seedCommitHash: "0xfedcba9876543210",
    dynamicPricing: {
      basePrice: 75000,
      decayFactor: 0.97,
      minPrice: 50000,
    },
    comboPackages: [
      {
        code: "silver" as const,
        title: "بسته نقره‌ای",
        paidTickets: 50,
        bonusTickets: 10,
        bonusChances: 5,
        vipDays: 7,
      },
      {
        code: "gold" as const,
        title: "بسته طلایی",
        paidTickets: 100,
        bonusTickets: 30,
        bonusChances: 15,
        vipDays: 30,
      },
    ],
  },
]

export const MOCK_WHEEL_CONFIG = {
  config: {
    wheelCostChances: 1,
    segments: [
      { label: "500,000 تومان", weight: 20, color: "#F43F5E", textColor: "#fff" },
      { label: "شانس اضافی", weight: 15, color: "#8B5CF6", textColor: "#fff" },
      { label: "1,000,000 تومان", weight: 10, color: "#0EA5E9", textColor: "#fff" },
      { label: "طلای آب شده", weight: 12, color: "#10B981", textColor: "#fff" },
      { label: "500,000 تومان", weight: 18, color: "#F59E0B", textColor: "#000" },
      { label: "بلیط قرعه", weight: 10, color: "#EC4899", textColor: "#fff" },
      { label: "کش بک", weight: 8, color: "#6366F1", textColor: "#fff" },
      { label: "2,000,000 تومان", weight: 7, color: "#14B8A6", textColor: "#fff" },
    ],
  },
  tiers: {
    normal: {
      enabled: true,
      costAsset: "CHANCE",
      costAmount: 1,
      segments: [
        { label: "500,000 تومان", weight: 30, color: "#F43F5E", textColor: "#fff" },
        { label: "شانس اضافی", weight: 20, color: "#8B5CF6", textColor: "#fff" },
        { label: "1,000,000 تومان", weight: 20, color: "#0EA5E9", textColor: "#fff" },
        { label: "طلای آب شده", weight: 30, color: "#10B981", textColor: "#fff" },
      ],
    },
    gold: {
      enabled: true,
      costAsset: "GOLD_SOT",
      costAmount: 50,
      segments: [
        { label: "5,000,000 تومان", weight: 25, color: "#F59E0B", textColor: "#000" },
        { label: "10 طلای آب شده", weight: 30, color: "#EC4899", textColor: "#fff" },
        { label: "20 بلیط قرعه", weight: 25, color: "#6366F1", textColor: "#fff" },
        { label: "خودرو!", weight: 20, color: "#14B8A6", textColor: "#fff" },
      ],
    },
    jackpot: {
      enabled: true,
      costAsset: "IRR",
      costAmount: 10000000,
      segments: [
        { label: "50,000,000 تومان", weight: 30, color: "#F43F5E", textColor: "#fff" },
        { label: "خودرو بی ام و!", weight: 20, color: "#8B5CF6", textColor: "#fff" },
        { label: "100 طلای آب شده", weight: 25, color: "#0EA5E9", textColor: "#fff" },
        { label: "خودروی لوکس!", weight: 25, color: "#10B981", textColor: "#fff" },
      ],
    },
  },
}

export const MOCK_WHEEL_HISTORY = [
  {
    id: "spin-1",
    label: "500,000 تومان",
    win: true,
    amount: 500000,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "spin-2",
    label: "شانس اضافی",
    win: true,
    chancesDelta: 2,
    createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "spin-3",
    label: "1,000,000 تومان",
    win: true,
    amount: 1000000,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "spin-4",
    label: "طلای آب شده",
    win: true,
    amount: 150,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
]

export const MOCK_SLIDE_DRAW = {
  draw: {
    id: "draw-current",
    status: "scheduled" as const,
    title: "قرعه کشی اسلاید امشب",
    scheduledAt: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
    participants: [
      { userId: "u-1", fullName: "علی احمدی", email: "ali@test.local", chances: 12 },
      { userId: "u-2", fullName: "مریم رضایی", email: "maryam@test.local", chances: 9 },
      { userId: "u-3", fullName: "حسین کاظمی", email: "hossein@test.local", chances: 7 },
    ],
    prizes: [
      { title: "جایزه رتبه 1", rankFrom: 1, rankTo: 1, amount: 50000000 },
      { title: "جایزه رتبه 2 تا 3", rankFrom: 2, rankTo: 3, amount: 10000000 },
      { title: "جایزه رتبه 4 تا 10", rankFrom: 4, rankTo: 10, amount: 1000000 },
    ],
    totalEntries: 280,
    winningLogs: [],
    winners: [],
    targetNumber: undefined,
  },
}

export const MOCK_SLIDE_SINGLE = {
  date: new Date().toISOString().slice(0, 10),
  hasTarget: true,
  targetNumber: 37,
}

export const MOCK_BATTLE_ROOMS = [
  {
    id: "room-1",
    status: "waiting" as const,
    entryAsset: "CHANCE" as const,
    entryAmount: 5,
    maxPlayers: 8,
    siteFeePercent: 5,
    potAmount: 20,
    players: [
      { userId: "u-1", rolledNumber: 12, joinedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
      { userId: "u-2", rolledNumber: 67, joinedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: "room-2",
    status: "finished" as const,
    entryAsset: "IRR" as const,
    entryAmount: 10000,
    maxPlayers: 10,
    siteFeePercent: 5,
    potAmount: 95000,
    winnerUserId: "u-4",
    players: [{ userId: "u-4", rolledNumber: 91, joinedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() }],
  },
]

export const MOCK_WALLET_DATA = {
  walletBalance: 5000000,
  goldSotBalance: 1500,
  loanLockedBalance: 500000,
  microBalance: 10000,
  history: [
    {
      id: "tx-1",
      type: "deposit",
      amount: 1000000,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      description: "ÙˆØ§Ø±ÛŒØ² Ø§Ø² Ú©Ø§Ø±Øª Ø¨Ø§Ù†Ú©ÛŒ",
      status: "completed" as const,
    },
    {
      id: "tx-2",
      type: "raffle_purchase",
      amount: -500000,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      description: "Ø®Ø±ÛŒØ¯ Ø¨Ù„ÛŒØ· Ù‚Ø±Ø¹Ù‡ Ú©Ø´ÛŒ ÙØ±Ø§Ø±ÛŒ",
      status: "completed" as const,
    },
    {
      id: "tx-3",
      type: "wheel_win",
      amount: 250000,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      description: "Ø¨Ø±Ø¯ Ø¯Ø± Ú†Ø±Ø® Ø´Ø§Ù†Ø³",
      status: "completed" as const,
    },
  ],
}

export const MOCK_LOANS = [
  {
    id: "loan-1",
    amount: 5000000,
    status: "active" as const,
    takenAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    interestRate: 5,
    totalDue: 5250000,
    paidAmount: 0,
  },
]

export const MOCK_REFERRAL_DATA = {
  referralCode: "USER123CODE",
  totalReferrals: 12,
  activeReferrals: 8,
  totalEarnings: 5000000,
  pendingEarnings: 1250000,
  referralHistory: [
    {
      id: "ref-1",
      userName: "Ø¹Ù„ÛŒ Ø§Ø­Ù…Ø¯ÛŒ",
      referredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active" as const,
      earnings: 500000,
    },
    {
      id: "ref-2",
      userName: "Ù…Ø­Ù…Ø¯ Ø±Ø¶Ø§ÛŒÛŒ",
      referredAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active" as const,
      earnings: 625000,
    },
  ],
}

export const MOCK_TICKETS = [
  {
    id: "ticket-1",
    raffleTitle: "Ù‚Ø±Ø¹Ù‡ Ú©Ø´ÛŒ ÙØ±Ø§Ø±ÛŒ",
    index: 1234,
    pricePaid: 50000,
    raffleStatus: "open" as const,
  },
  {
    id: "ticket-2",
    raffleTitle: "Ù‚Ø±Ø¹Ù‡ Ú©Ø´ÛŒ ÙØ±Ø§Ø±ÛŒ",
    index: 5678,
    pricePaid: 48500,
    raffleStatus: "open" as const,
  },
  {
    id: "ticket-3",
    raffleTitle: "Ù‚Ø±Ø¹Ù‡ Ú©Ø´ÛŒ Ù„Ø§Ù…Ø¨ÙˆØ±Ú¯ÛŒÙ†ÛŒ",
    index: 342,
    pricePaid: 75000,
    raffleStatus: "open" as const,
  },
]

export const MOCK_PROFILE = {
  fullName: "Ø¹Ù„ÛŒ Ø§Ø­Ù…Ø¯ÛŒ",
  username: "aliahmadi",
  phone: "+98 910 123 4567",
  city: "ØªÙ‡Ø±Ø§Ù†",
  address: "Ø®ÛŒØ§Ø¨Ø§Ù† ÙˆÙ„ÛŒØ¹ØµØ±ØŒ Ù¾Ù„Ø§Ú© 123",
  bio: "Ø¹Ù„Ø§Ù‚Ù…Ù†Ø¯ Ø¨Ù‡ Ù‚Ø±Ø¹Ù‡ Ú©Ø´ÛŒ Ùˆ Ø¨Ø§Ø²ÛŒ Ù‡Ø§ÛŒ Ø¢Ù†Ù„Ø§ÛŒÙ†",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
}

export const MOCK_SUPPORT_TICKETS = [
  {
    id: "ticket-1",
    subject: "Ù…Ø´Ú©Ù„ Ø¯Ø± ÙˆØ§Ø±ÛŒØ²",
    status: "open" as const,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    messages: 3,
  },
  {
    id: "ticket-2",
    subject: "Ø³ÙˆØ§Ù„ Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ù‚Ø±Ø¹Ù‡ Ú©Ø´ÛŒ",
    status: "closed" as const,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    messages: 2,
  },
]

export const MOCK_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "info",
    title: "Ù‚Ø±Ø¹Ù‡ Ú©Ø´ÛŒ Ø¬Ø¯ÛŒØ¯",
    body: "Ù‚Ø±Ø¹Ù‡ Ú©Ø´ÛŒ Ù¾ÙˆØ±Ø´Ù‡ 911 Ø¢ØºØ§Ø² Ø´Ø¯",
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-2",
    type: "success",
    title: "Ø¨Ø±Ø¯ Ø´Ù…Ø§",
    body: "Ø´Ù…Ø§ 1,000,000 ØªÙˆÙ…Ø§Ù† Ø±Ø§ Ø¯Ø± Ú†Ø±Ø® Ø´Ø§Ù†Ø³ Ø¨Ø±Ø¯!",
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-3",
    type: "warning",
    title: "Ø²ÛŒØ±Ù…Ø¬Ù…ÙˆØ¹Ù‡ ÙØ¹Ø§Ù„",
    body: "ÛŒÚ©ÛŒ Ø§Ø² Ø²ÛŒØ±Ù…Ø¬Ù…ÙˆØ¹Ù‡ Ù‡Ø§ÛŒ Ø´Ù…Ø§ ÙØ¹Ø§Ù„ Ø´Ø¯",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const MOCK_ENGAGEMENT_DASHBOARD = {
  level: 5,
  experience: 4500,
  nextLevelXp: 5000,
  streakDays: 7,
  totalMissions: 15,
  completedMissions: 9,
  unlockedAchievements: 12,
  totalAchievements: 25,
}

export const MOCK_MISSIONS = [
  {
    code: "daily-spin",
    title: "Ø±ÙˆØ² Ø±Ø§ Ø¨Ø§ ÛŒÚ© Ø¨Ø§Ø± Ú†Ø±Ø®Ø´ Ø´Ø±ÙˆØ¹ Ú©Ù†ÛŒØ¯",
    description: "Ø­Ø¯Ø§Ù‚Ù„ ÛŒÚ© Ø¨Ø§Ø± Ø¯Ø± Ú†Ø±Ø® Ø´Ø§Ù†Ø³ Ø¨Ø§Ø²ÛŒ Ú©Ù†ÛŒØ¯",
    reward: { type: "xp", value: 100 },
    progress: 1,
    target: 1,
    completed: true,
  },
  {
    code: "raffle-tickets",
    title: "Ø®Ø±ÛŒØ¯ Ø¨Ù„ÛŒØ· Ù‚Ø±Ø¹Ù‡ Ú©Ø´ÛŒ",
    description: "Ø­Ø¯Ø§Ù‚Ù„ 5 Ø¨Ù„ÛŒØ· Ù‚Ø±Ø¹Ù‡ Ú©Ø´ÛŒ Ø®Ø±ÛŒØ¯ÛŒØ¯",
    reward: { type: "chances", value: 3 },
    progress: 5,
    target: 5,
    completed: true,
  },
  {
    code: "referral-active",
    title: "ÙØ¹Ø§Ù„ Ú©Ø±Ø¯Ù† ÛŒÚ© Ø²ÛŒØ±Ù…Ø¬Ù…ÙˆØ¹Ù‡",
    description: "ÛŒÚ© Ø¯ÙˆØ³Øª Ø±Ø§ Ù…Ø¹Ø±ÙÛŒ Ú©Ù†ÛŒØ¯ Ùˆ Ø§Ùˆ ÙØ¹Ø§Ù„ Ø´ÙˆØ¯",
    reward: { type: "gold", value: 100 },
    progress: 8,
    target: 10,
    completed: false,
  },
]

export const MOCK_AUCTIONS = [
  {
    id: "auction-1",
    title: "Ferrari 812 Superfast",
    currentBid: 85000000,
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000",
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    bidders: 12,
  },
  {
    id: "auction-2",
    title: "Lamborghini HuracÃ¡n",
    currentBid: 65000000,
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000",
    endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    bidders: 8,
  },
]

export const MOCK_ADMIN_USERS = [
  {
    id: "user-1",
    email: "user1@example.com",
    name: "Ø¹Ù„ÛŒ Ø§Ø­Ù…Ø¯ÛŒ",
    role: "user" as const,
    status: "active" as const,
    joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user-2",
    email: "user2@example.com",
    name: "Ù…Ø­Ù…Ø¯ Ø±Ø¶Ø§ÛŒÛŒ",
    role: "user" as const,
    status: "active" as const,
    joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const MOCK_ADMIN_DRAWS = [
  {
    id: "draw-1",
    status: "scheduled" as const,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    participantsCount: 250,
    prizePool: 50000000,
  },
  {
    id: "draw-2",
    status: "active" as const,
    startTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    participantsCount: 500,
    prizePool: 100000000,
  },
]

export const MOCK_LEGAL = {
  rules: `
<h2>Ù‚ÙˆØ§Ù†ÛŒÙ† Ùˆ Ù…Ù‚Ø±Ø±Ø§Øª</h2>
<p>Ù„Ø·ÙØ§ Ù‚ÙˆØ§Ù†ÛŒÙ† Ø²ÛŒØ± Ø±Ø§ Ù‚Ø¨Ù„ Ø§Ø² Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø§Ø² Ø³Ø§ÛŒØª Ù…Ø·Ø§Ù„Ø¹Ù‡ Ú©Ù†ÛŒØ¯:</p>
<ol>
<li>Ø´Ù…Ø§ Ø¨Ø§ÛŒØ¯ Ø­Ø¯Ø§Ù‚Ù„ 18 Ø³Ø§Ù„ Ø¯Ø§Ø´ØªÙ‡ Ø¨Ø§Ø´ÛŒØ¯</li>
<li>ØªÙ…Ø§Ù… Ø§Ø·Ù„Ø§Ø¹Ø§Øª ÙˆØ§Ø±Ø¯ Ø´Ø¯Ù‡ Ø¨Ø§ÛŒØ¯ ØµØ­ÛŒØ­ Ø¨Ø§Ø´Ø¯</li>
<li>Ù…Ø³Ø¦ÙˆÙ„ Ø±Ø¹Ø§ÛŒØª Ù‚ÙˆØ§Ù†ÛŒÙ† Ù…Ø­Ù„ÛŒ Ù‡Ø³ØªÛŒØ¯</li>
<li>ØªÙ‚Ù„Ø¨ ÛŒØ§ Ø³ÙˆØ¡ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ù…Ù…Ù†ÙˆØ¹ Ø§Ø³Øª</li>
</ol>
`,
}

