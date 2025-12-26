// ============================================================================
// BASE DE DONNÉES D'IMAGES - SOURCE UNSPLASH UNIQUEMENT
// ============================================================================
// Images haute qualité pour les embeds Discord
// Source unique: Unsplash (images.unsplash.com)

// =============================================================================
// ANIME - Style japonais, cyberpunk, action (Unsplash)
// =============================================================================
const ANIME_IMAGES = {
  AOT_WALLPAPER_1: {
    name: 'Anime - Epic Battle Scene',
    category: 'Wallpaper',
    anime: 'Action Style',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80',
    source: 'Unsplash'
  },
  AOT_WALLPAPER_2: {
    name: 'Anime - Warriors',
    category: 'Character',
    anime: 'Action Style',
    image: 'https://images.unsplash.com/photo-1611457194403-d3f156e14f8c?w=1920&q=80',
    source: 'Unsplash'
  },
  DEMON_SLAYER_1: {
    name: 'Anime - Japanese Art Style',
    category: 'Wallpaper',
    anime: 'Art Style',
    image: 'https://images.unsplash.com/photo-1574362946149-6e179f9bca6c?w=1920&q=80',
    source: 'Unsplash'
  },
  DEMON_SLAYER_2: {
    name: 'Anime - Neon City',
    category: 'Character',
    anime: 'Cyber Style',
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=1920&q=80',
    source: 'Unsplash'
  },
  JJK_GOJO: {
    name: 'Anime - Dark Magic',
    category: 'Character',
    anime: 'Dark Fantasy',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80',
    source: 'Unsplash'
  },
  JJK_YUJI: {
    name: 'Anime - Dynamic Action',
    category: 'Wallpaper',
    anime: 'Action Style',
    image: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=1920&q=80',
    source: 'Unsplash'
  },
  JJK_MEGUMI: {
    name: 'Anime - Mystic Arts',
    category: 'Character',
    anime: 'Dark Fantasy',
    image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=1920&q=80',
    source: 'Unsplash'
  },
  MHA_DEKU: {
    name: 'Anime - Hero Rising',
    category: 'Character',
    anime: 'Superhero Style',
    image: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=1920&q=80',
    source: 'Unsplash'
  },
  MHA_BAKUGO: {
    name: 'Anime - Explosive Action',
    category: 'Character',
    anime: 'Action Style',
    image: 'https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=1920&q=80',
    source: 'Unsplash'
  },
  ONE_PIECE_LUFFY: {
    name: 'Anime - Pirate Adventure',
    category: 'Character',
    anime: 'Adventure Style',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    source: 'Unsplash'
  },
  ONE_PIECE_ZORO: {
    name: 'Anime - Sword Master',
    category: 'Character',
    anime: 'Action Style',
    image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=1920&q=80',
    source: 'Unsplash'
  },
  EDGERUNNERS_LUCY: {
    name: 'Cyberpunk - Netrunner Girl',
    category: 'Character',
    anime: 'Cyberpunk Edgerunners',
    image: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1920&q=80',
    source: 'Unsplash'
  },
  EDGERUNNERS_DAVID: {
    name: 'Cyberpunk - Street Warrior',
    category: 'Character',
    anime: 'Cyberpunk Edgerunners',
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1920&q=80',
    source: 'Unsplash'
  },
  SOLO_LEVELING_SUNG: {
    name: 'Anime - Shadow Monarch',
    category: 'Character',
    anime: 'Dark Fantasy',
    image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1920&q=80',
    source: 'Unsplash'
  },
  NARUTO_SASUKE: {
    name: 'Anime - Rival Battle',
    category: 'Wallpaper',
    anime: 'Ninja Style',
    image: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
    source: 'Unsplash'
  },
  DBZ_GOKEN_ULTRA: {
    name: 'Anime - Ultra Power',
    category: 'Character',
    anime: 'Power Fantasy',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIME_SCHOOL: {
    name: 'Anime - Japanese School',
    category: 'Wallpaper',
    anime: 'Slice of Life',
    image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIME_CHERRY_BLOSSOM: {
    name: 'Anime - Sakura Season',
    category: 'Wallpaper',
    anime: 'Romantic Style',
    image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIME_NIGHT_CITY: {
    name: 'Anime - Tokyo Nights',
    category: 'Wallpaper',
    anime: 'Urban Style',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIME_MOUNTAINS: {
    name: 'Anime - Mountain Temple',
    category: 'Wallpaper',
    anime: 'Fantasy Style',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIME_BEACH: {
    name: 'Anime - Summer Beach',
    category: 'Wallpaper',
    anime: 'Slice of Life',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// CYBERPUNK / TECH - Cities, Characters, Abstract (Unsplash)
// =============================================================================
const CYBERPUNK_IMAGES = {
  CYBER_CITY_NIGHT: {
    name: 'Cyberpunk City - Night Rain',
    category: 'City',
    image: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_CITY_NEON: {
    name: 'Neon District - Tokyo',
    category: 'City',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_CITY_ROOFTOP: {
    name: 'Rooftop View - 2077',
    category: 'City',
    image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_GIRL: {
    name: 'Cyber Girl - Neon',
    category: 'Character',
    image: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_HACKER: {
    name: 'Hacker - Terminal',
    category: 'Character',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_MATRIX: {
    name: 'Matrix Code - Digital Rain',
    category: 'Abstract',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_CIRCUIT: {
    name: 'Circuit Board - Glow',
    category: 'Abstract',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_AI: {
    name: 'AI Core - Neural Network',
    category: 'Abstract',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_RAIN: {
    name: 'Rainy Street - Neon',
    category: 'Atmosphere',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// DEVOPS / TECH - Infrastructure, Cloud, Coding (Unsplash)
// =============================================================================
const DEVOPS_IMAGES = {
  DATACENTER_SERVERS: {
    name: 'Data Center - Server Racks',
    category: 'Infrastructure',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80',
    source: 'Unsplash'
  },
  DATACENTER_CABLES: {
    name: 'Server Room - Cables',
    category: 'Infrastructure',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1920&q=80',
    source: 'Unsplash'
  },
  CLOUD_COMPUTING: {
    name: 'Cloud Computing - Abstract',
    category: 'Cloud',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  CLOUD_SERVER: {
    name: 'Cloud Server - Network',
    category: 'Cloud',
    image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1920&q=80',
    source: 'Unsplash'
  },
  CODE_SCREEN: {
    name: 'Code Editor - Dark Theme',
    category: 'Development',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },
  TERMINAL: {
    name: 'Terminal - Matrix Style',
    category: 'Development',
    image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1920&q=80',
    source: 'Unsplash'
  },
  CONTAINERS: {
    name: 'Docker Containers - Ship',
    category: 'Containers',
    image: 'https://images.unsplash.com/photo-1607799275518-d58665d096b1?w=1920&q=80',
    source: 'Unsplash'
  },
  PIPELINE: {
    name: 'CI/CD Pipeline - Automation',
    category: 'CI/CD',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    source: 'Unsplash'
  },
  DASHBOARD: {
    name: 'Monitoring Dashboard - Grafana',
    category: 'Monitoring',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
    source: 'Unsplash'
  },
  SECURITY_LOCK: {
    name: 'Cybersecurity - Lock',
    category: 'Security',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// NATURE / LANDSCAPES (Unsplash)
// =============================================================================
const NATURE_IMAGES = {
  MOUNTAINS: {
    name: 'Mountains - Sunset',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    source: 'Unsplash'
  },
  OCEAN: {
    name: 'Ocean Waves - Sunset',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&q=80',
    source: 'Unsplash'
  },
  FOREST: {
    name: 'Forest - Morning Mist',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
    source: 'Unsplash'
  },
  DESERT: {
    name: 'Desert Dunes - Gold',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1920&q=80',
    source: 'Unsplash'
  },
  AURORA: {
    name: 'Northern Lights - Aurora',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80',
    source: 'Unsplash'
  },
  WATERFALL: {
    name: 'Waterfall - Iceland',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// ESPORT - Arena, Setup, Gaming (Unsplash)
// =============================================================================
const ESPORT_IMAGES = {
  ESPORT_ARENA: {
    name: 'Esports Arena - Crowd',
    category: 'Arena',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80',
    source: 'Unsplash'
  },
  ESPORT_STAGE: {
    name: 'Esports Stage - Lights',
    category: 'Arena',
    image: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=1920&q=80',
    source: 'Unsplash'
  },
  ESPORT_GAMING: {
    name: 'Pro Gaming Setup',
    category: 'Setup',
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1920&q=80',
    source: 'Unsplash'
  },
  ESPORT_KEYBOARD: {
    name: 'RGB Gaming Keyboard',
    category: 'Gear',
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=1920&q=80',
    source: 'Unsplash'
  },
};

// Export all - Source Unsplash uniquement
export {
  ANIME_IMAGES,
  CYBERPUNK_IMAGES,
  DEVOPS_IMAGES,
  NATURE_IMAGES,
  ESPORT_IMAGES,
};

// For backward compatibility
export const REAL_IMAGES = {
  ...ANIME_IMAGES,
  ...CYBERPUNK_IMAGES,
  ...DEVOPS_IMAGES,
  ...NATURE_IMAGES,
  ...ESPORT_IMAGES,
};
