// ============================================================================
// BASE DE DONNÉES D'IMAGES UNSPLASH - COLLECTION COMPLÈTE
// ============================================================================
// Images haute qualité pour les embeds Discord
// Source: Unsplash (images.unsplash.com) - Gratuit, sans API key
//
// CATÉGORIES DISPONIBLES:
// - abstract, anime, architecture, art, animals, business, cyberpunk
// - devops, esport, fashion, food, nature, neon, night, people, space
// - sports, technology, travel, vintage, wallpaper, etc.
// ============================================================================

// =============================================================================
// ABSTRACT - Forms, Colors, Textures (Unsplash)
// =============================================================================
const ABSTRACT_IMAGES = {
  ABSTRACT_FLUID: {
    name: 'Fluid Abstract - Colorful',
    category: 'Fluid',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1920&q=80',
    source: 'Unsplash'
  },
  ABSTRACT_GEOMETRIC: {
    name: 'Geometric Shapes - Modern',
    category: 'Geometric',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
    source: 'Unsplash'
  },
  ABSTRACT_GRADIENT: {
    name: 'Gradient - Blue Purple',
    category: 'Gradient',
    image: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
    source: 'Unsplash'
  },
  ABSTRACT_WAVES: {
    name: 'Abstract Waves - Flow',
    category: 'Waves',
    image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&q=80',
    source: 'Unsplash'
  },
  ABSTRACT_CIRCLES: {
    name: 'Concentric Circles',
    category: 'Circles',
    image: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920&q=80',
    source: 'Unsplash'
  },
  ABSTRACT_LIGHT: {
    name: 'Light Painting - Neon',
    category: 'Light',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
    source: 'Unsplash'
  },
};

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
// ANIMALS - Wildlife, Pets, Nature (Unsplash)
// =============================================================================
const ANIMALS_IMAGES = {
  ANIMAL_LION: {
    name: 'Lion - King of Jungle',
    category: 'Wildlife',
    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIMAL_TIGER: {
    name: 'Tiger - Stripes Power',
    category: 'Wildlife',
    image: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIMAL_EAGLE: {
    name: 'Eagle - Flight',
    category: 'Birds',
    image: 'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIMAL_WOLF: {
    name: 'Wolf - Moon Howl',
    category: 'Wildlife',
    image: 'https://images.unsplash.com/photo-1504569089716-720c7a8b42f7?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIMAL_CAT: {
    name: 'Cat - Cute Pet',
    category: 'Pets',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIMAL_DOG: {
    name: 'Dog - Loyal Friend',
    category: 'Pets',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIMAL_HORSE: {
    name: 'Horse - Freedom',
    category: 'Farm',
    image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIMAL_DOLPHIN: {
    name: 'Dolphin - Ocean Play',
    category: 'Marine',
    image: 'https://images.unsplash.com/photo-1607153333879-c174d265f1d2?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIMAL_BUTTERFLY: {
    name: 'Butterfly - Nature Art',
    category: 'Insects',
    image: 'https://images.unsplash.com/photo-1550829432-c5024aa52eb0?w=1920&q=80',
    source: 'Unsplash'
  },
  ANIMAL_PANDA: {
    name: 'Panda - Bamboo',
    category: 'Wildlife',
    image: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// ARCHITECTURE - Buildings, Cities, Structures (Unsplash)
// =============================================================================
const ARCHITECTURE_IMAGES = {
  ARCH_SKYSCRAPER: {
    name: 'Skyscraper - Modern',
    category: 'Modern',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=80',
    source: 'Unsplash'
  },
  ARCH_BRIDGE: {
    name: 'Bridge - Golden Hour',
    category: 'Structures',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    source: 'Unsplash'
  },
  ARCH_CHURCH: {
    name: 'Church - Gothic',
    category: 'Religious',
    image: 'https://images.unsplash.com/photo-1518005052351-ecc1df37fccd?w=1920&q=80',
    source: 'Unsplash'
  },
  ARCH_CASTLE: {
    name: 'Castle - Medieval',
    category: 'Historic',
    image: 'https://images.unsplash.com/photo-1518005052351-ecc1df37fccd?w=1920&q=80',
    source: 'Unsplash'
  },
  ARCH_TOWER: {
    name: 'Tower - Eiffel',
    category: 'Landmark',
    image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1920&q=80',
    source: 'Unsplash'
  },
  ARCH_STADIUM: {
    name: 'Stadium - Sports Arena',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=1920&q=80',
    source: 'Unsplash'
  },
  ARCH_LIBRARY: {
    name: 'Library - Books',
    category: 'Education',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80',
    source: 'Unsplash'
  },
  ARCH_MUSEUM: {
    name: 'Museum - Art Gallery',
    category: 'Culture',
    image: 'https://images.unsplash.com/photo-1554907984-48612d0466c8?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// ART - Paintings, Sculptures, Creative (Unsplash)
// =============================================================================
const ART_IMAGES = {
  ART_PAINTING: {
    name: 'Oil Painting - Classic',
    category: 'Painting',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1920&q=80',
    source: 'Unsplash'
  },
  ART_SCULPTURE: {
    name: 'Sculpture - Marble',
    category: 'Sculpture',
    image: 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=1920&q=80',
    source: 'Unsplash'
  },
  ART_GRAFFITI: {
    name: 'Graffiti - Street Art',
    category: 'Street Art',
    image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1920&q=80',
    source: 'Unsplash'
  },
  ART_MOSAIC: {
    name: 'Mosaic - Tiles',
    category: 'Craft',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80',
    source: 'Unsplash'
  },
  ART_DIGITAL: {
    name: 'Digital Art - Abstract',
    category: 'Digital',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
    source: 'Unsplash'
  },
  ART_WATERCOLOR: {
    name: 'Watercolor - Soft',
    category: 'Painting',
    image: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// BUSINESS - Office, Meeting, Startup (Unsplash)
// =============================================================================
const BUSINESS_IMAGES = {
  BUSINESS_MEETING: {
    name: 'Business Meeting - Professional',
    category: 'Office',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80',
    source: 'Unsplash'
  },
  BUSINESS_DESK: {
    name: 'Office Desk - Work',
    category: 'Office',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920&q=80',
    source: 'Unsplash'
  },
  BUSINESS_HANDSHAKE: {
    name: 'Handshake - Partnership',
    category: 'Agreement',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&q=80',
    source: 'Unsplash'
  },
  BUSINESS_PRESENTATION: {
    name: 'Presentation - Pitch',
    category: 'Meeting',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80',
    source: 'Unsplash'
  },
  BUSINESS_STARTUP: {
    name: 'Startup Team - Collaboration',
    category: 'Team',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80',
    source: 'Unsplash'
  },
  BUSINESS_COFFEE: {
    name: 'Coffee Shop - Work',
    category: 'Casual',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80',
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
  CYBER_NEON_SIGN: {
    name: 'Neon Signs - Night Market',
    category: 'City',
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_FUTURISTIC_BUILDING: {
    name: 'Futuristic Architecture - Glass',
    category: 'City',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_PURPLE_LIGHTS: {
    name: 'Purple Neon - Night',
    category: 'Atmosphere',
    image: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_ROBOT: {
    name: 'Robot Hand - Human',
    category: 'Character',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_VIRTUAL_REALITY: {
    name: 'VR Headset - Immersion',
    category: 'Tech',
    image: 'https://images.unsplash.com/photo-1622979135225-d2ba269fb1bd?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_DATA_STREAM: {
    name: 'Data Stream - Fiber Optics',
    category: 'Abstract',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_HOLOGRAPH: {
    name: 'Holographic Display',
    category: 'Tech',
    image: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=1920&q=80',
    source: 'Unsplash'
  },
  CYBER_GRID: {
    name: 'Digital Grid - Tron Style',
    category: 'Abstract',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80',
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
  ESPORT_MONITOR: {
    name: 'Gaming Monitor - RGB',
    category: 'Gear',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1920&q=80',
    source: 'Unsplash'
  },
  ESPORT_HEADSET: {
    name: 'Gaming Headset - Pro',
    category: 'Gear',
    image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=1920&q=80',
    source: 'Unsplash'
  },
  ESPORT_CONTROLLER: {
    name: 'Game Controller - Neon',
    category: 'Gear',
    image: 'https://images.unsplash.com/photo-1593305841991-05c29736f87e?w=1920&q=80',
    source: 'Unsplash'
  },
  ESPORT_TEAM: {
    name: 'Esports Team - Victory',
    category: 'Competition',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80',
    source: 'Unsplash'
  },
  ESPORT_DESK: {
    name: 'Gaming Desk - Setup',
    category: 'Setup',
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=1920&q=80',
    source: 'Unsplash'
  },
  ESPORT_MOUSE: {
    name: 'Gaming Mouse - RGB',
    category: 'Gear',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=1920&q=80',
    source: 'Unsplash'
  },
  ESPORT_LIVE: {
    name: 'Live Gaming - Stream',
    category: 'Competition',
    image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// FASHION - Style, Clothing, Trends (Unsplash)
// =============================================================================
const FASHION_IMAGES = {
  FASHION_MODEL: {
    name: 'Fashion Model - Portrait',
    category: 'Portrait',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=80',
    source: 'Unsplash'
  },
  FASHION_STREET: {
    name: 'Street Fashion - Urban',
    category: 'Street',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1920&q=80',
    source: 'Unsplash'
  },
  FASHION_RUNWAY: {
    name: 'Runway Show - Designer',
    category: 'Show',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=80',
    source: 'Unsplash'
  },
  FASHION_SHOES: {
    name: 'Sneakers - Collection',
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1920&q=80',
    source: 'Unsplash'
  },
  FASHION_WATCH: {
    name: 'Luxury Watch - Time',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=1920&q=80',
    source: 'Unsplash'
  },
  FASHION_SUNGLASSES: {
    name: 'Sunglasses - Summer',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// FOOD - Cuisine, Dishes, Drinks (Unsplash)
// =============================================================================
const FOOD_IMAGES = {
  FOOD_PIZZA: {
    name: 'Pizza - Italian',
    category: 'Italian',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&q=80',
    source: 'Unsplash'
  },
  FOOD_BURGER: {
    name: 'Burger - Fast Food',
    category: 'American',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=80',
    source: 'Unsplash'
  },
  FOOD_SUSHI: {
    name: 'Sushi - Japanese',
    category: 'Japanese',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1920&q=80',
    source: 'Unsplash'
  },
  FOOD_PASTA: {
    name: 'Pasta - Italian',
    category: 'Italian',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d1a9?w=1920&q=80',
    source: 'Unsplash'
  },
  FOOD_SALAD: {
    name: 'Salad - Healthy',
    category: 'Healthy',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1920&q=80',
    source: 'Unsplash'
  },
  FOOD_CAKE: {
    name: 'Cake - Dessert',
    category: 'Dessert',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&q=80',
    source: 'Unsplash'
  },
  FOOD_COFFEE: {
    name: 'Coffee - Morning',
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80',
    source: 'Unsplash'
  },
  FOOD_TEA: {
    name: 'Tea - Zen',
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=1920&q=80',
    source: 'Unsplash'
  },
  FOOD_WINE: {
    name: 'Wine - Red',
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1920&q=80',
    source: 'Unsplash'
  },
  FOOD_FRUITS: {
    name: 'Fresh Fruits - Healthy',
    category: 'Healthy',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=1920&q=80',
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
  LAKE_REFLECTION: {
    name: 'Lake - Mountain Reflection',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    source: 'Unsplash'
  },
  AUTUMN_FOREST: {
    name: 'Autumn Forest - Colors',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80',
    source: 'Unsplash'
  },
  SNOW_MOUNTAINS: {
    name: 'Snow Mountains - Peaceful',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1920&q=80',
    source: 'Unsplash'
  },
  STARRY_NIGHT: {
    name: 'Starry Night - Stars',
    category: 'Sky',
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80',
    source: 'Unsplash'
  },
  SUNSET_BEACH: {
    name: 'Beach Sunset - Golden Hour',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    source: 'Unsplash'
  },
  FLOWER_FIELD: {
    name: 'Flower Field - Lavender',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1920&q=80',
    source: 'Unsplash'
  },
  RIVER_VALLEY: {
    name: 'River Valley - Green',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
    source: 'Unsplash'
  },
  CANYON: {
    name: 'Canyon - Grand',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1920&q=80',
    source: 'Unsplash'
  },
  TROPICAL_BEACH: {
    name: 'Tropical Beach - Paradise',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// NEON - Lights, Signs, Night City (Unsplash)
// =============================================================================
const NEON_IMAGES = {
  NEON_SIGN: {
    name: 'Neon Sign - Glow',
    category: 'Signs',
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1920&q=80',
    source: 'Unsplash'
  },
  NEON_CITY: {
    name: 'Neon City - Night',
    category: 'City',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80',
    source: 'Unsplash'
  },
  NEON_PURPLE: {
    name: 'Purple Neon - Lights',
    category: 'Lights',
    image: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=1920&q=80',
    source: 'Unsplash'
  },
  NEON_PINK: {
    name: 'Pink Neon - Cyberpunk',
    category: 'Lights',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
    source: 'Unsplash'
  },
  NEON_BLUE: {
    name: 'Blue Neon - Tech',
    category: 'Lights',
    image: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
    source: 'Unsplash'
  },
  NEON_TEXT: {
    name: 'Neon Text - Typography',
    category: 'Typography',
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// NIGHT - Dark, Evening, Moon (Unsplash)
// =============================================================================
const NIGHT_IMAGES = {
  NIGHT_CITY: {
    name: 'City Night - Lights',
    category: 'City',
    image: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1920&q=80',
    source: 'Unsplash'
  },
  NIGHT_MOON: {
    name: 'Full Moon - Dark',
    category: 'Moon',
    image: 'https://images.unsplash.com/photo-1532996409704-8f990c7e1f3e?w=1920&q=80',
    source: 'Unsplash'
  },
  NIGHT_STARS: {
    name: 'Starry Night - Sky',
    category: 'Stars',
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80',
    source: 'Unsplash'
  },
  NIGHT_STREET: {
    name: 'Street Night - Empty',
    category: 'Street',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80',
    source: 'Unsplash'
  },
  NIGHT_CAR: {
    name: 'Car Lights - Trails',
    category: 'Traffic',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// PEOPLE - Portrait, Lifestyle, Culture (Unsplash)
// =============================================================================
const PEOPLE_IMAGES = {
  PEOPLE_PORTRAIT: {
    name: 'Portrait - Professional',
    category: 'Portrait',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80',
    source: 'Unsplash'
  },
  PEOPLE_GROUP: {
    name: 'Group - Friends',
    category: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80',
    source: 'Unsplash'
  },
  PEOPLE_CROWD: {
    name: 'Crowd - Event',
    category: 'Event',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80',
    source: 'Unsplash'
  },
  PEOPLE_SPORT: {
    name: 'Athlete - Running',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80',
    source: 'Unsplash'
  },
  PEOPLE_WORK: {
    name: 'Work - Office',
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=80',
    source: 'Unsplash'
  },
  PEOPLE_ARTIST: {
    name: 'Artist - Creative',
    category: 'Creative',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// SPACE - Universe, Planets, Cosmos (Unsplash)
// =============================================================================
const SPACE_IMAGES = {
  SPACE_EARTH: {
    name: 'Earth - Planet',
    category: 'Planets',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  SPACE_STARS: {
    name: 'Stars - Galaxy',
    category: 'Universe',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80',
    source: 'Unsplash'
  },
  SPACE_MOON: {
    name: 'Moon - Full',
    category: 'Moon',
    image: 'https://images.unsplash.com/photo-1532996409704-8f990c7e1f3e?w=1920&q=80',
    source: 'Unsplash'
  },
  SPACE_NEBULA: {
    name: 'Nebula - Colorful',
    category: 'Cosmos',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80',
    source: 'Unsplash'
  },
  SPACE_ROCKET: {
    name: 'Rocket - Launch',
    category: 'Spacecraft',
    image: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=1920&q=80',
    source: 'Unsplash'
  },
  SPACE_ASTRONAUT: {
    name: 'Astronaut - Spacewalk',
    category: 'People',
    image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// SPORTS - Competition, Action, Fitness (Unsplash)
// =============================================================================
const SPORTS_IMAGES = {
  SPORT_FOOTBALL: {
    name: 'Football - Soccer',
    category: 'Team',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1920&q=80',
    source: 'Unsplash'
  },
  SPORT_BASKETBALL: {
    name: 'Basketball - Court',
    category: 'Team',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1920&q=80',
    source: 'Unsplash'
  },
  SPORT_TENNIS: {
    name: 'Tennis - Court',
    category: 'Individual',
    image: 'https://images.unsplash.com/photo-1622279457366-055ecdf9ccf7?w=1920&q=80',
    source: 'Unsplash'
  },
  SPORT_GOLF: {
    name: 'Golf - Green',
    category: 'Outdoor',
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1920&q=80',
    source: 'Unsplash'
  },
  SPORT_SWIMMING: {
    name: 'Swimming - Pool',
    category: 'Water',
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1920&q=80',
    source: 'Unsplash'
  },
  SPORT_CYCLING: {
    name: 'Cycling - Mountain',
    category: 'Outdoor',
    image: 'https://images.unsplash.com/photo-1541621973255-2bc3e9793514?w=1920&q=80',
    source: 'Unsplash'
  },
  SPORT_GYM: {
    name: 'Gym - Fitness',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
    source: 'Unsplash'
  },
  SPORT_BOXING: {
    name: 'Boxing - Ring',
    category: 'Combat',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// TECHNOLOGY - Innovation, Digital, Modern (Unsplash)
// =============================================================================
const TECHNOLOGY_IMAGES = {
  TECH_LAPTOP: {
    name: 'Laptop - Working',
    category: 'Devices',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_PHONE: {
    name: 'Smartphone - Modern',
    category: 'Devices',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_TABLET: {
    name: 'Tablet - Touch',
    category: 'Devices',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_HEADPHONES: {
    name: 'Headphones - Music',
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_CAMERA: {
    name: 'Camera - Photography',
    category: 'Photography',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_WATCH: {
    name: 'Smartwatch - Wearable',
    category: 'Wearable',
    image: 'https://images.unsplash.com/photo-15795863370-7b6527506a22?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_DRONE: {
    name: 'Drone - Flying',
    category: 'Tech',
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_ROBOT: {
    name: 'Robot - AI',
    category: 'AI',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// TRAVEL - Adventure, Places, Culture (Unsplash)
// =============================================================================
const TRAVEL_IMAGES = {
  TRAVEL_AIRPORT: {
    name: 'Airport - Departure',
    category: 'Transport',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80',
    source: 'Unsplash'
  },
  TRAVEL_PLANE: {
    name: 'Airplane - Flying',
    category: 'Transport',
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=1920&q=80',
    source: 'Unsplash'
  },
  TRAVEL_HOTEL: {
    name: 'Hotel - Luxury',
    category: 'Accommodation',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
    source: 'Unsplash'
  },
  TRAVEL_MAP: {
    name: 'Map - World',
    category: 'Navigation',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1920&q=80',
    source: 'Unsplash'
  },
  TRAVEL_BACKPACK: {
    name: 'Backpack - Adventure',
    category: 'Hiking',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    source: 'Unsplash'
  },
  TRAVEL_BEACH: {
    name: 'Beach - Vacation',
    category: 'Relaxation',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    source: 'Unsplash'
  },
  TRAVEL_MOUNTAIN: {
    name: 'Mountain - Hiking',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    source: 'Unsplash'
  },
  TRAVEL_CITY: {
    name: 'City - Urban',
    category: 'Urban',
    image: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// VINTAGE - Retro, Classic, Nostalgia (Unsplash)
// =============================================================================
const VINTAGE_IMAGES = {
  VINTAGE_CAR: {
    name: 'Vintage Car - Classic',
    category: 'Vehicle',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&q=80',
    source: 'Unsplash'
  },
  VINTAGE_CAMERA: {
    name: 'Vintage Camera - Film',
    category: 'Photography',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1920&q=80',
    source: 'Unsplash'
  },
  VINTAGE_RADIO: {
    name: 'Vintage Radio - Retro',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    source: 'Unsplash'
  },
  VINTAGE_TYPEWRITER: {
    name: 'Typewriter - Writing',
    category: 'Office',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920&q=80',
    source: 'Unsplash'
  },
  VINTAGE_WATCH: {
    name: 'Pocket Watch - Timeless',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=1920&q=80',
    source: 'Unsplash'
  },
  VINTAGE_BOOK: {
    name: 'Old Book - Library',
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80',
    source: 'Unsplash'
  },
  VINTAGE_RECORD: {
    name: 'Vinyl Record - Music',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=1920&q=80',
    source: 'Unsplash'
  },
  VINTAGE_POSTER: {
    name: 'Vintage Poster - Art',
    category: 'Decor',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// WALLPAPER - Desktop, Mobile, Background (Unsplash)
// =============================================================================
const WALLPAPER_IMAGES = {
  WALLPAPER_MINIMAL: {
    name: 'Minimal - Clean',
    category: 'Minimal',
    image: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
    source: 'Unsplash'
  },
  WALLPAPER_COLOR: {
    name: 'Colorful - Gradient',
    category: 'Gradient',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
    source: 'Unsplash'
  },
  WALLPAPER_DARK: {
    name: 'Dark - Mood',
    category: 'Dark',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80',
    source: 'Unsplash'
  },
  WALLPAPER_NATURE: {
    name: 'Nature - Landscape',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    source: 'Unsplash'
  },
  WALLPAPER_ABSTRACT: {
    name: 'Abstract - Art',
    category: 'Abstract',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1920&q=80',
    source: 'Unsplash'
  },
  WALLPAPER_CITY: {
    name: 'City - Urban',
    category: 'City',
    image: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// TECH_AI - MCP, Claude Code, N8N, Agent, Gemini, Grok (Unsplash)
// =============================================================================
const TECH_AI_IMAGES = {
  // ===========================================================================
  // MCP & CLAUDE
  // ===========================================================================
  TECH_AI_MCP: {
    name: 'MCP - Protocol Integration',
    category: 'MCP',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_CLAUDE: {
    name: 'Claude AI - Assistant',
    category: 'Claude',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_CLAUDE_CODE: {
    name: 'Claude Code - Development',
    category: 'Claude Code',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_ANTHROPIC: {
    name: 'Anthropic - AI Safety',
    category: 'Anthropic',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // N8N & AUTOMATION
  // ===========================================================================
  TECH_AI_N8N: {
    name: 'N8N - Workflow Automation',
    category: 'N8N',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_AUTOMATION: {
    name: 'Automation - Workflows',
    category: 'Automation',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_WORKFLOW: {
    name: 'Workflow - Process',
    category: 'Workflow',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_NO_CODE: {
    name: 'No-Code Platform',
    category: 'No-Code',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // AI AGENTS & BOTS
  // ===========================================================================
  TECH_AI_AGENT: {
    name: 'AI Agent - Assistant',
    category: 'Agent',
    image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_BOT: {
    name: 'AI Bot - Chatbot',
    category: 'Bot',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_CHATBOT: {
    name: 'Chatbot Interface',
    category: 'Chatbot',
    image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_VIRTUAL_ASSISTANT: {
    name: 'Virtual Assistant',
    category: 'Assistant',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // LLM & LANGUAGE MODELS
  // ===========================================================================
  TECH_AI_GEMINI: {
    name: 'Gemini - Google AI',
    category: 'Gemini',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_GROK: {
    name: 'Grok - xAI',
    category: 'Grok',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_CHATGPT: {
    name: 'ChatGPT - OpenAI',
    category: 'ChatGPT',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_LLM: {
    name: 'Large Language Model',
    category: 'LLM',
    image: 'https://images.unsplash.com/photo-1620712943543-bf3f63f65f0f?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // NEURAL NETWORKS & DEEP LEARNING
  // ===========================================================================
  TECH_AI_NEURAL: {
    name: 'Neural Network - Deep Learning',
    category: 'AI',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_BRAIN: {
    name: 'Artificial Brain - AI',
    category: 'AI',
    image: 'https://images.unsplash.com/photo-1620712943543-bf3f63f65f0f?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_DEEP_LEARNING: {
    name: 'Deep Learning - Layers',
    category: 'Deep Learning',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_ML: {
    name: 'Machine Learning - AI',
    category: 'Machine Learning',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // DATA SCIENCE & ANALYTICS
  // ===========================================================================
  TECH_AI_DATA: {
    name: 'Data Science - Analytics',
    category: 'Data',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_BIG_DATA: {
    name: 'Big Data - Processing',
    category: 'Big Data',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_ANALYTICS: {
    name: 'Analytics Dashboard',
    category: 'Analytics',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // CLOUD & INFRASTRUCTURE
  // ===========================================================================
  TECH_AI_CLOUD: {
    name: 'Cloud Computing',
    category: 'Cloud',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_SERVER: {
    name: 'Server Infrastructure',
    category: 'Server',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_API: {
    name: 'API Integration',
    category: 'API',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_MICROSERVICES: {
    name: 'Microservices Architecture',
    category: 'Microservices',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // AI TOOLS & FRAMEWORKS
  // ===========================================================================
  TECH_AI_TENSORFLOW: {
    name: 'TensorFlow - ML Framework',
    category: 'TensorFlow',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_PYTORCH: {
    name: 'PyTorch - Deep Learning',
    category: 'PyTorch',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_HUGGINGFACE: {
    name: 'HuggingFace - NLP',
    category: 'HuggingFace',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // AI APPLICATIONS
  // ===========================================================================
  TECH_AI_COMPUTER_VISION: {
    name: 'Computer Vision - AI',
    category: 'Computer Vision',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_NLP: {
    name: 'Natural Language Processing',
    category: 'NLP',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80',
    source: 'Unsplash'
  },
  TECH_AI_GENERATIVE: {
    name: 'Generative AI - Creation',
    category: 'Generative',
    image: 'https://images.unsplash.com/photo-1620712943543-bf3f63f65f0f?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// DEVELOPMENT - JavaScript, Python, Code, Programming, Full Stack (Unsplash)
// =============================================================================
const DEVELOPMENT_IMAGES = {
  // ===========================================================================
  // PROGRAMMING LANGUAGES
  // ===========================================================================
  DEV_JAVASCRIPT: {
    name: 'JavaScript - Code',
    category: 'JavaScript',
    image: 'https://images.unsplash.com/photo-1627398242451-6f9c0a9a63a4?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_PYTHON: {
    name: 'Python - Programming',
    category: 'Python',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_TYPESCRIPT: {
    name: 'TypeScript - Code',
    category: 'TypeScript',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },
 DEV_RUST: {
    name: 'Rust - Systems',
    category: 'Rust',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_GO: {
    name: 'Go - Google',
    category: 'Go',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_JAVA: {
    name: 'Java - Enterprise',
    category: 'Java',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_CPP: {
    name: 'C++ - Performance',
    category: 'C++',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_PHP: {
    name: 'PHP - Web',
    category: 'PHP',
    image: 'https://images.unsplash.com/photo-1627398242451-6f9c0a9a63a4?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_RUBY: {
    name: 'Ruby - Rails',
    category: 'Ruby',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_SWIFT: {
    name: 'Swift - iOS',
    category: 'Swift',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_KOTLIN: {
    name: 'Kotlin - Android',
    category: 'Kotlin',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // WEB DEVELOPMENT
  // ===========================================================================
  DEV_HTML: {
    name: 'HTML - Web Structure',
    category: 'HTML',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_CSS: {
    name: 'CSS - Styling',
    category: 'CSS',
    image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_SASS: {
    name: 'Sass - CSS Preprocessor',
    category: 'Sass',
    image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_TAILWIND: {
    name: 'Tailwind CSS',
    category: 'Tailwind',
    image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // FRONTEND FRAMEWORKS
  // ===========================================================================
  DEV_REACT: {
    name: 'React - Frontend',
    category: 'React',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_VUE: {
    name: 'Vue.js - Framework',
    category: 'Vue',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_ANGULAR: {
    name: 'Angular - Google',
    category: 'Angular',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_NEXTJS: {
    name: 'Next.js - React Framework',
    category: 'Next.js',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_SVELTE: {
    name: 'Svelte - Framework',
    category: 'Svelte',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // BACKEND & SERVER
  // ===========================================================================
  DEV_NODE: {
    name: 'Node.js - Backend',
    category: 'Node',
    image: 'https://images.unsplash.com/photo-1627398242451-6f9c0a9a63a4?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_EXPRESS: {
    name: 'Express - Server',
    category: 'Express',
    image: 'https://images.unsplash.com/photo-1627398242451-6f9c0a9a63a4?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_NESTJS: {
    name: 'NestJS - Node Framework',
    category: 'NestJS',
    image: 'https://images.unsplash.com/photo-1627398242451-6f9c0a9a63a4?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_FASTAPI: {
    name: 'FastAPI - Python',
    category: 'FastAPI',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_DJANGO: {
    name: 'Django - Python Web',
    category: 'Django',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_FLASK: {
    name: 'Flask - Microframework',
    category: 'Flask',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_SPRING: {
    name: 'Spring Boot - Java',
    category: 'Spring',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // DATABASES
  // ===========================================================================
  DEV_SQL: {
    name: 'SQL - Database',
    category: 'SQL',
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_MONGODB: {
    name: 'MongoDB - NoSQL',
    category: 'MongoDB',
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_POSTGRESQL: {
    name: 'PostgreSQL - Database',
    category: 'PostgreSQL',
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_REDIS: {
    name: 'Redis - Cache',
    category: 'Redis',
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_MYSQL: {
    name: 'MySQL - Database',
    category: 'MySQL',
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_FIREBASE: {
    name: 'Firebase - Google',
    category: 'Firebase',
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // TOOLS & IDE
  // ===========================================================================
  DEV_CODE: {
    name: 'Code - Programming',
    category: 'Code',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_SCREEN: {
    name: 'Code Screen - Dark Theme',
    category: 'IDE',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_TERMINAL: {
    name: 'Terminal - Command Line',
    category: 'Terminal',
    image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_VSCODE: {
    name: 'VS Code - Editor',
    category: 'VS Code',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_INTELLIJ: {
    name: 'IntelliJ IDEA',
    category: 'IntelliJ',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // DEVOPS & INFRASTRUCTURE
  // ===========================================================================
  DEV_DOCKER: {
    name: 'Docker - Containers',
    category: 'Docker',
    image: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_KUBERNETES: {
    name: 'Kubernetes - Orchestration',
    category: 'Kubernetes',
    image: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_AWS: {
    name: 'AWS - Cloud',
    category: 'AWS',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_AZURE: {
    name: 'Azure - Microsoft Cloud',
    category: 'Azure',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_GCP: {
    name: 'Google Cloud Platform',
    category: 'GCP',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_VERCEL: {
    name: 'Vercel - Deployment',
    category: 'Vercel',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_NETLIFY: {
    name: 'Netlify - Hosting',
    category: 'Netlify',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_GITHUB: {
    name: 'GitHub - Version Control',
    category: 'GitHub',
    image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_GITLAB: {
    name: 'GitLab - DevOps',
    category: 'GitLab',
    image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_CI_CD: {
    name: 'CI/CD Pipeline',
    category: 'CI/CD',
    image: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // TESTING & QUALITY
  // ===========================================================================
  DEV_JEST: {
    name: 'Jest - Testing',
    category: 'Jest',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_CYPRESS: {
    name: 'Cypress - E2E Testing',
    category: 'Cypress',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_TESTING: {
    name: 'Testing - QA',
    category: 'Testing',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // MOBILE DEVELOPMENT
  // ===========================================================================
  DEV_REACT_NATIVE: {
    name: 'React Native - Mobile',
    category: 'React Native',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_FLUTTER: {
    name: 'Flutter - Mobile',
    category: 'Flutter',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_XAMARIN: {
    name: 'Xamarin - Mobile',
    category: 'Xamarin',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_IONIC: {
    name: 'Ionic - Hybrid Mobile',
    category: 'Ionic',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // GENERAL DEVELOPMENT
  // ===========================================================================
  DEV_PROGRAMMING: {
    name: 'Programming - Development',
    category: 'Programming',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_DEBUGGING: {
    name: 'Debugging - Fixing Bugs',
    category: 'Debugging',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_GIT: {
    name: 'Git - Version Control',
    category: 'Git',
    image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_ALGORITHMS: {
    name: 'Algorithms - Logic',
    category: 'Algorithms',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_API: {
    name: 'API - Integration',
    category: 'API',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_REST: {
    name: 'REST API',
    category: 'REST',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    source: 'Unsplash'
  },
  DEV_GRAPHQL: {
    name: 'GraphQL - Query',
    category: 'GraphQL',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// SCIENCE - Math, Physics, Biology, Chemistry, Space, Medicine (Unsplash)
// =============================================================================
const SCIENCE_IMAGES = {
  // ===========================================================================
  // MATHEMATICS
  // ===========================================================================
  SCI_MATH: {
    name: 'Mathematics - Formulas',
    category: 'Math',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_GEOMETRY: {
    name: 'Geometry - Shapes',
    category: 'Geometry',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_CALCULUS: {
    name: 'Calculus - Math',
    category: 'Calculus',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_ALGEBRA: {
    name: 'Algebra - Equations',
    category: 'Algebra',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_STATISTICS: {
    name: 'Statistics - Data',
    category: 'Statistics',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_FRACTALS: {
    name: 'Fractals - Patterns',
    category: 'Fractals',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // PHYSICS
  // ===========================================================================
  SCI_PHYSICS: {
    name: 'Physics - Laws',
    category: 'Physics',
    image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_QUANTUM: {
    name: 'Quantum Physics',
    category: 'Quantum',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_ATOM: {
    name: 'Atom - Structure',
    category: 'Atom',
    image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_ELECTROMAGNETISM: {
    name: 'Electromagnetism',
    category: 'Electromagnetism',
    image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_RELATIVITY: {
    name: 'Relativity - Einstein',
    category: 'Relativity',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_THERMODYNAMICS: {
    name: 'Thermodynamics - Heat',
    category: 'Thermodynamics',
    image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_OPTICS: {
    name: 'Optics - Light',
    category: 'Optics',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // CHEMISTRY
  // ===========================================================================
  SCI_CHEMISTRY: {
    name: 'Chemistry - Lab',
    category: 'Chemistry',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_MOLECULES: {
    name: 'Molecules - Structure',
    category: 'Molecules',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_PERIODIC: {
    name: 'Periodic Table',
    category: 'Chemistry',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_REACTION: {
    name: 'Chemical Reaction',
    category: 'Chemistry',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_LAB_CHEMISTRY: {
    name: 'Chemistry Lab',
    category: 'Chemistry',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // BIOLOGY
  // ===========================================================================
  SCI_BIOLOGY: {
    name: 'Biology - Life',
    category: 'Biology',
    image: 'https://images.unsplash.com/photo-1530216129470-8e4c1b1d3635?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_DNA: {
    name: 'DNA - Genetics',
    category: 'DNA',
    image: 'https://images.unsplash.com/photo-1530216129470-8e4c1b1d3635?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_CELL: {
    name: 'Cell - Microscope',
    category: 'Cell',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_MICROBIOLOGY: {
    name: 'Microbiology - Bacteria',
    category: 'Microbiology',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_BOTANY: {
    name: 'Botany - Plants',
    category: 'Botany',
    image: 'https://images.unsplash.com/photo-1530216129470-8e4c1b1d3635?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_ZOOLOGY: {
    name: 'Zoology - Animals',
    category: 'Zoology',
    image: 'https://images.unsplash.com/photo-1530216129470-8e4c1b1d3635?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_GENETICS: {
    name: 'Genetics - Heredity',
    category: 'Genetics',
    image: 'https://images.unsplash.com/photo-1530216129470-8e4c1b1d3635?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_EVOLUTION: {
    name: 'Evolution - Darwin',
    category: 'Evolution',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // NEUROSCIENCE & PSYCHOLOGY
  // ===========================================================================
  SCI_NEUROSCIENCE: {
    name: 'Neuroscience - Brain',
    category: 'Neuroscience',
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_BRAIN_SCAN: {
    name: 'Brain Scan - MRI',
    category: 'Brain',
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_NEURONS: {
    name: 'Neurons - Network',
    category: 'Neurons',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_PSYCHOLOGY: {
    name: 'Psychology - Mind',
    category: 'Psychology',
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_COGNITIVE: {
    name: 'Cognitive Science',
    category: 'Cognitive',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // SPACE & ASTRONOMY
  // ===========================================================================
  SCI_SPACE: {
    name: 'Space - Universe',
    category: 'Space',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_PLANETS: {
    name: 'Planets - Solar System',
    category: 'Planets',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_STARS: {
    name: 'Stars - Galaxy',
    category: 'Stars',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_NEBULA: {
    name: 'Nebula - Space Cloud',
    category: 'Nebula',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_ASTRONOMY: {
    name: 'Astronomy - Telescope',
    category: 'Astronomy',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_COSMOS: {
    name: 'Cosmos - Big Bang',
    category: 'Cosmos',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // MEDICAL SCIENCE
  // ===========================================================================
  SCI_MEDICINE: {
    name: 'Medicine - Healthcare',
    category: 'Medicine',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_MEDICAL_RESEARCH: {
    name: 'Medical Research',
    category: 'Research',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_PHARMA: {
    name: 'Pharmaceuticals',
    category: 'Pharma',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_LAB_MEDICAL: {
    name: 'Medical Lab',
    category: 'Lab',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // EARTH SCIENCE
  // ===========================================================================
  SCI_GEOLOGY: {
    name: 'Geology - Rocks',
    category: 'Geology',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_WEATHER: {
    name: 'Weather - Climate',
    category: 'Weather',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_ENVIRONMENT: {
    name: 'Environmental Science',
    category: 'Environment',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_CLIMATE: {
    name: 'Climate Change',
    category: 'Climate',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // ARCHAEOLOGY & PALEONTOLOGY
  // ===========================================================================
  SCI_ARCHAEOLOGY: {
    name: 'Archaeology - Ancient',
    category: 'Archaeology',
    image: 'https://images.unsplash.com/photo-1599764697395-4fe6a3db8a93?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_FOSSILS: {
    name: 'Fossils - History',
    category: 'Fossils',
    image: 'https://images.unsplash.com/photo-1599764697395-4fe6a3db8a93?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_EXCAVATION: {
    name: 'Excavation - Dig',
    category: 'Excavation',
    image: 'https://images.unsplash.com/photo-1554907984-48612d0466c8?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_PALEONTOLOGY: {
    name: 'Paleontology - Dinosaurs',
    category: 'Paleontology',
    image: 'https://images.unsplash.com/photo-1599764697395-4fe6a3db8a93?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_ANCIENT: {
    name: 'Ancient Civilizations',
    category: 'Ancient',
    image: 'https://images.unsplash.com/photo-1554907984-48612d0466c8?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // NUCLEAR & ENERGY
  // ===========================================================================
  SCI_NUCLEAR: {
    name: 'Nuclear - Energy',
    category: 'Nuclear',
    image: 'https://images.unsplash.com/photo-1503829027158-8fe7eaee2bfa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_ATOM_ENERGY: {
    name: 'Atomic Energy',
    category: 'Nuclear',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_FISSION: {
    name: 'Nuclear Fission',
    category: 'Nuclear',
    image: 'https://images.unsplash.com/photo-1503829027158-8fe7eaee2bfa?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_FUSION: {
    name: 'Nuclear Fusion',
    category: 'Nuclear',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // ROBOTICS & AI
  // ===========================================================================
  SCI_ROBOTICS: {
    name: 'Robotics - Robots',
    category: 'Robotics',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_ROBOT_ARM: {
    name: 'Robot Arm - Automation',
    category: 'Robotics',
    image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_HUMANOID: {
    name: 'Humanoid Robot',
    category: 'Robotics',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_AUTOMATION: {
    name: 'Automation - Industry',
    category: 'Automation',
    image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // GENERAL SCIENCE
  // ===========================================================================
  SCI_RESEARCH: {
    name: 'Scientific Research',
    category: 'Research',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_LAB: {
    name: 'Science Laboratory',
    category: 'Lab',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_EXPERIMENT: {
    name: 'Scientific Experiment',
    category: 'Experiment',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1920&q=80',
    source: 'Unsplash'
  },
  SCI_INNOVATION: {
    name: 'Scientific Innovation',
    category: 'Innovation',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// FINANCE - Stock Market, Trading, Banking, Crypto, Business (Unsplash)
// =============================================================================
const FINANCE_IMAGES = {
  // ===========================================================================
  // STOCK MARKET & TRADING
  // ===========================================================================
  FIN_STOCK: {
    name: 'Stock Market - Trading',
    category: 'Stock',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_TRADING: {
    name: 'Trading - Charts',
    category: 'Trading',
    image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_BULL_BEAR: {
    name: 'Bull Bear - Market',
    category: 'Market',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_CHARTS: {
    name: 'Financial Charts - Analysis',
    category: 'Charts',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_BLOOMBERG: {
    name: 'Bloomberg Terminal',
    category: 'Terminal',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_INVESTING: {
    name: 'Investing - Portfolio',
    category: 'Investing',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_DIVIDENDS: {
    name: 'Dividends - Income',
    category: 'Dividends',
    image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_WALLSTREET: {
    name: 'Wall Street - NYSE',
    category: 'NYSE',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_FOREX: {
    name: 'Forex - Currency',
    category: 'Forex',
    image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_OPTIONS: {
    name: 'Options Trading',
    category: 'Options',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_DAY_TRADING: {
    name: 'Day Trading',
    category: 'Day Trading',
    image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_SWING: {
    name: 'Swing Trading',
    category: 'Swing',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // CRYPTO & BLOCKCHAIN
  // ===========================================================================
  FIN_CRYPTO: {
    name: 'Cryptocurrency - Bitcoin',
    category: 'Crypto',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_BITCOIN: {
    name: 'Bitcoin - BTC',
    category: 'Bitcoin',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_ETHEREUM: {
    name: 'Ethereum - ETH',
    category: 'Ethereum',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_BLOCKCHAIN: {
    name: 'Blockchain - Tech',
    category: 'Blockchain',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_WALLET: {
    name: 'Crypto Wallet',
    category: 'Wallet',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_NFT: {
    name: 'NFT - Digital Art',
    category: 'NFT',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_DEFI: {
    name: 'DeFi - Decentralized',
    category: 'DeFi',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // BANKING & CREDIT
  // ===========================================================================
  FIN_BANK: {
    name: 'Bank - Finance',
    category: 'Bank',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_CREDIT_CARD: {
    name: 'Credit Card',
    category: 'Credit Card',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_LOAN: {
    name: 'Loan - Mortgage',
    category: 'Loan',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_MORTGAGE: {
    name: 'Mortgage - Real Estate',
    category: 'Mortgage',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_SAVINGS: {
    name: 'Savings Account',
    category: 'Savings',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_INTEREST: {
    name: 'Interest Rates',
    category: 'Interest',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_ATM: {
    name: 'ATM - Cash',
    category: 'ATM',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // FINANCIAL REPORTS & DOCUMENTS
  // ===========================================================================
  FIN_REPORT: {
    name: 'Financial Report - Analysis',
    category: 'Report',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_SPREADSHEET: {
    name: 'Spreadsheet - Excel',
    category: 'Excel',
    image: 'https://images.unsplash.com/photo-1544650208-2e8a075d2f1d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_CALCULATOR: {
    name: 'Calculator - Finance',
    category: 'Calculator',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_INVOICE: {
    name: 'Invoice - Billing',
    category: 'Invoice',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_RECEIPT: {
    name: 'Receipt - Proof',
    category: 'Receipt',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_BUDGET: {
    name: 'Budget Planning',
    category: 'Budget',
    image: 'https://images.unsplash.com/photo-1544650208-2e8a075d2f1d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_TAX: {
    name: 'Tax - IRS',
    category: 'Tax',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_AUDIT: {
    name: 'Audit - Accounting',
    category: 'Audit',
    image: 'https://images.unsplash.com/photo-1544650208-2e8a075d2f1d?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // CALENDAR & SCHEDULING
  // ===========================================================================
  FIN_CALENDAR: {
    name: 'Calendar - Schedule',
    category: 'Calendar',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_PLANNER: {
    name: 'Planner - Agenda',
    category: 'Planner',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_DATE: {
    name: 'Date - Schedule',
    category: 'Schedule',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_DEADLINE: {
    name: 'Deadline - Due Date',
    category: 'Deadline',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_QUARTER: {
    name: 'Quarterly - Q1 Q2 Q3 Q4',
    category: 'Quarter',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_FYE: {
    name: 'Fiscal Year End',
    category: 'FYE',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // MONEY & CURRENCY
  // ===========================================================================
  FIN_MONEY: {
    name: 'Money - Cash',
    category: 'Money',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_COINS: {
    name: 'Coins - Currency',
    category: 'Coins',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_DOLLAR: {
    name: 'Dollar - USD',
    category: 'Dollar',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_EURO: {
    name: 'Euro - EUR',
    category: 'Euro',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_POUNDS: {
    name: 'Pounds - GBP',
    category: 'Pounds',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_YEN: {
    name: 'Yen - JPY',
    category: 'Yen',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // BUSINESS FINANCE
  // ===========================================================================
  FIN_BUSINESS: {
    name: 'Business Finance',
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_REVENUE: {
    name: 'Revenue - Sales',
    category: 'Revenue',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_PROFIT: {
    name: 'Profit - Margin',
    category: 'Profit',
    image: 'https://images.unsplash.com/photo-1544650208-2e8a075d2f1d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_EXPENSE: {
    name: 'Expenses - Costs',
    category: 'Expense',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_CASHFLOW: {
    name: 'Cash Flow',
    category: 'Cash Flow',
    image: 'https://images.unsplash.com/photo-1544650208-2e8a075d2f1d?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_ROI: {
    name: 'ROI - Return',
    category: 'ROI',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // INSURANCE & REAL ESTATE
  // ===========================================================================
  FIN_INSURANCE: {
    name: 'Insurance - Protection',
    category: 'Insurance',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_REAL_ESTATE: {
    name: 'Real Estate - Property',
    category: 'Real Estate',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_HOME: {
    name: 'Home - House',
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80',
    source: 'Unsplash'
  },
  FIN_APARTMENT: {
    name: 'Apartment - Rent',
    category: 'Apartment',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// GAMING - Setups, Consoles, Peripherals, Esports, VR (Unsplash)
// =============================================================================
const GAMING_IMAGES = {
  // ===========================================================================
  // GAMING SETUPS - PC Gaming, Desktop, RGB
  // ===========================================================================
  GAMING_SETUP_1: {
    name: 'Gaming Setup - RGB',
    category: 'Setup',
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_SETUP_2: {
    name: 'Gaming Desktop - Dual Monitor',
    category: 'Setup',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_SETUP_3: {
    name: 'Gaming Room - Triple Monitor',
    category: 'Setup',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_SETUP_4: {
    name: 'Clean Setup - Minimal',
    category: 'Setup',
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_SETUP_NIGHT: {
    name: 'Gaming Night - Neon Lights',
    category: 'Setup',
    image: 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // GAMING PERIPHERALS - Keyboards, Mice, Headsets
  // ===========================================================================
  GAMING_KEYBOARD: {
    name: 'Mechanical Keyboard - RGB',
    category: 'Keyboard',
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_KEYBOARD_2: {
    name: 'Gaming Keyboard - Backlit',
    category: 'Keyboard',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_MOUSE: {
    name: 'Gaming Mouse - RGB',
    category: 'Mouse',
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_HEADSET: {
    name: 'Gaming Headset - Pro',
    category: 'Headset',
    image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // CONSOLES - PlayStation, Xbox, Nintendo
  // ===========================================================================
  GAMING_CONTROLLER_PS: {
    name: 'PlayStation Controller - DualSense',
    category: 'PlayStation',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_CONTROLLER_XBOX: {
    name: 'Xbox Controller - Wireless',
    category: 'Xbox',
    image: 'https://images.unsplash.com/photo-1593305841991-05c29736f87e?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_CONTROLLER_SWITCH: {
    name: 'Nintendo Switch - JoyCons',
    category: 'Nintendo',
    image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_CONTROLLERS: {
    name: 'Game Controllers Collection',
    category: 'Controller',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // ESPORTS & TOURNAMENTS
  // ===========================================================================
  GAMING_ESPORTS_ARENA: {
    name: 'Esports Arena - Stage',
    category: 'Esports',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_ESPORTS_TEAM: {
    name: 'Esports Team - Victory',
    category: 'Esports',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_TOURNAMENT: {
    name: 'Gaming Tournament - Live',
    category: 'Esports',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // VR GAMING
  // ===========================================================================
  GAMING_VR_HEADSET: {
    name: 'VR Headset - Oculus',
    category: 'VR',
    image: 'https://images.unsplash.com/photo-1622979135225-d2ba269fb1bd?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_VR_PLAYING: {
    name: 'VR Gaming - Immersive',
    category: 'VR',
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // GAMING CULTURE
  // ===========================================================================
  GAMING_HANDHELD: {
    name: 'Handheld Gaming - Switch',
    category: 'Handheld',
    image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_STREAMING: {
    name: 'Streaming Setup - Webcam',
    category: 'Streaming',
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_RETRO: {
    name: 'Retro Gaming - Classic',
    category: 'Retro',
    image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_CASUAL: {
    name: 'Casual Gaming - Sofa',
    category: 'Casual',
    image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // GAMING EVENTS & CONVENTIONS
  // ===========================================================================
  GAMING_EVENT: {
    name: 'Gaming Convention - Crowd',
    category: 'Event',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_LAN: {
    name: 'LAN Party - Friends',
    category: 'LAN Party',
    image: 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // GAMING THEMES
  // ===========================================================================
  GAMING_NEON: {
    name: 'Gaming Neon - Cyberpunk',
    category: 'Neon',
    image: 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_DESKTOP: {
    name: 'Gaming Desktop - Tower',
    category: 'PC',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_LAPTOP: {
    name: 'Gaming Laptop - Portable',
    category: 'Laptop',
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // OPEN WORLD & ADVENTURE (Cities, Cars, Exploration)
  // ===========================================================================
  GAMING_OPEN_WORLD: {
    name: 'Open World - City',
    category: 'Open World',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b8e?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_RACING: {
    name: 'Racing - Sports Car',
    category: 'Racing',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_NIGHT_CITY: {
    name: 'Night City - Urban',
    category: 'Open World',
    image: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // CREATIVE & BUILDING (Minecraft-like)
  // ===========================================================================
  GAMING_BLOCKS: {
    name: 'Block Building - Creative',
    category: 'Building',
    image: 'https://images.unsplash.com/photo-1587573089734-5999604b1a2c?w=1920&q=80',
    source: 'Unsplash'
  },
  GAMING_CREATIVE: {
    name: 'Creative Mode - Building',
    category: 'Creative',
    image: 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// LIFESTYLE - Party, Humor, Coffee, Food, Travel, Wellness (Unsplash)
// =============================================================================
const LIFESTYLE_IMAGES = {
  // ===========================================================================
  // PARTY & CELEBRATION
  // ===========================================================================
  LIFE_PARTY: {
    name: 'Party - Celebration',
    category: 'Party',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_CONFETTI: {
    name: 'Confetti - Fun',
    category: 'Celebration',
    image: 'https://images.unsplash.com/photo-1530103862676-de3c9a59af57?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_BALLOONS: {
    name: 'Balloons - Colorful',
    category: 'Party',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_CHAMPAGNE: {
    name: 'Champagne - Toast',
    category: 'Celebration',
    image: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_FIREWORKS: {
    name: 'Fireworks - Show',
    category: 'Fireworks',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_FESTIVAL: {
    name: 'Festival - Music',
    category: 'Festival',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_BIRTHDAY: {
    name: 'Birthday - Cake',
    category: 'Birthday',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_GRADUATION: {
    name: 'Graduation - Success',
    category: 'Graduation',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_WEDDING: {
    name: 'Wedding - Marriage',
    category: 'Wedding',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // HUMOR & ENTERTAINMENT
  // ===========================================================================
  LIFE_HUMOR: {
    name: 'Humor - Fun',
    category: 'Humor',
    image: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_MEME: {
    name: 'Meme - Viral',
    category: 'Meme',
    image: 'https://images.unsplash.com/photo-1535409337836-2b4a8ae9c4eb?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_FUNNY: {
    name: 'Funny - Laugh',
    category: 'Funny',
    image: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_COMEDY: {
    name: 'Comedy - Show',
    category: 'Comedy',
    image: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=1920&q=80',
    source: 'Unsplash'
  },
  LAUGH: {
    name: 'Laugh - Happiness',
    category: 'Laugh',
    image: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_JOKE: {
    name: 'Joke - Humor',
    category: 'Joke',
    image: 'https://images.unsplash.com/photo-1535409337836-2b4a8ae9c4eb?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // COFFEE & TEA
  // ===========================================================================
  LIFE_COFFEE: {
    name: 'Coffee - Morning',
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_COFFEE_CUP: {
    name: 'Coffee Cup - Latte Art',
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_COFFEE_BEANS: {
    name: 'Coffee Beans - Fresh',
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_CAFE: {
    name: 'Cafe - Coffee Shop',
    category: 'Cafe',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_ESPRESSO: {
    name: 'Espresso - Strong',
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_LATTE: {
    name: 'Latte - Milk',
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_TEA: {
    name: 'Tea - Herbal',
    category: 'Tea',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_TEA_CUP: {
    name: 'Tea Cup - Ceramic',
    category: 'Tea',
    image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // FOOD & BAKERY
  // ===========================================================================
  LIFE_BRETZEL: {
    name: 'Bretzel - Pretzel',
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1609127102567-8a9a21dc27d8?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_PRETZEL: {
    name: 'Pretzel - Snack',
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1609127102567-8a9a21dc27d8?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_BAKERY: {
    name: 'Bakery - Fresh Bread',
    category: 'Bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_BREAD: {
    name: 'Bread - Artisan',
    category: 'Bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_CROISSANT: {
    name: 'Croissant - French',
    category: 'Bakery',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f40388085?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_PASTRY: {
    name: 'Pastry - Dessert',
    category: 'Dessert',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f40388085?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_PIZZA: {
    name: 'Pizza - Italian',
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_BURGER: {
    name: 'Burger - Fast Food',
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_SUSHI: {
    name: 'Sushi - Japanese',
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_ICECREAM: {
    name: 'Ice Cream - Sweet',
    category: 'Dessert',
    image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // EDUCATION & LEARNING
  // ===========================================================================
  LIFE_FORMATION: {
    name: 'Formation - Learning',
    category: 'Education',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_EDUCATION: {
    name: 'Education - Study',
    category: 'Education',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_COURSE: {
    name: 'Course - Training',
    category: 'Training',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_SCHOOL: {
    name: 'School - Classroom',
    category: 'Education',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_STUDENT: {
    name: 'Student - Learning',
    category: 'Education',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_TUTORING: {
    name: 'Tutoring - Mentor',
    category: 'Education',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // RESOURCES & DOCUMENTATION
  // ===========================================================================
  LIFE_RESOURCE: {
    name: 'Resource - Documentation',
    category: 'Resource',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_BOOKS: {
    name: 'Books - Library',
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_GUIDE: {
    name: 'Guide - Tutorial',
    category: 'Guide',
    image: 'https://images.unsplash.com/photo-1526244042195-8f936a2b2c57?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_DOCUMENTATION: {
    name: 'Documentation - Manual',
    category: 'Documentation',
    image: 'https://images.unsplash.com/photo-1526244042195-8f936a2b2c57?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_WIKI: {
    name: 'Wiki - Knowledge',
    category: 'Wiki',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_TUTORIAL: {
    name: 'Tutorial - How To',
    category: 'Tutorial',
    image: 'https://images.unsplash.com/photo-1526244042195-8f936a2b2c57?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // COMMUNITY & SUPPORT
  // ===========================================================================
  LIFE_ENTRAIDE: {
    name: 'Entraide - Community',
    category: 'Community',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_TEAMWORK: {
    name: 'Teamwork - Collaboration',
    category: 'Teamwork',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_HELP: {
    name: 'Help - Support',
    category: 'Support',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_COMMUNITY: {
    name: 'Community - Group',
    category: 'Community',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_NETWORKING: {
    name: 'Networking - Connect',
    category: 'Networking',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_VOLUNTEER: {
    name: 'Volunteer - Charity',
    category: 'Volunteer',
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_FORUM: {
    name: 'Forum - Discussion',
    category: 'Forum',
    image: 'https://images.unsplash.com/photo-1526244042195-8f936a2b2c57?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // DESIGN & CREATIVE
  // ===========================================================================
  LIFE_DESIGN: {
    name: 'Graphisme - Design',
    category: 'Design',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_CREATIVE: {
    name: 'Creative - Art',
    category: 'Creative',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_GRAPHIC: {
    name: 'Graphic Design',
    category: 'Design',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_ART: {
    name: 'Art - Painting',
    category: 'Art',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_ILLUSTRATION: {
    name: 'Illustration - Drawing',
    category: 'Illustration',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_PHOTOSHOP: {
    name: 'Photoshop - Editing',
    category: 'Editing',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_COLOR: {
    name: 'Color - Palette',
    category: 'Color',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // TRAVEL & ADVENTURE
  // ===========================================================================
  LIFE_TRAVEL: {
    name: 'Travel - Adventure',
    category: 'Travel',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_VACATION: {
    name: 'Vacation - Holiday',
    category: 'Vacation',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_BEACH: {
    name: 'Beach - Ocean',
    category: 'Beach',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_MOUNTAIN: {
    name: 'Mountain - Hiking',
    category: 'Mountain',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_SIGHTSEEING: {
    name: 'Sightseeing - Landmarks',
    category: 'Sightseeing',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_HOTEL: {
    name: 'Hotel - Resort',
    category: 'Hotel',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // HEALTH & WELLNESS
  // ===========================================================================
  LIFE_FITNESS: {
    name: 'Fitness - Gym',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_YOGA: {
    name: 'Yoga - Meditation',
    category: 'Yoga',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_RUN: {
    name: 'Running - Jogging',
    category: 'Running',
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_HEALTHY: {
    name: 'Healthy - Food',
    category: 'Healthy',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_WELLNESS: {
    name: 'Wellness - Spa',
    category: 'Wellness',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_MEDITATION: {
    name: 'Meditation - Zen',
    category: 'Meditation',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // MUSIC & ENTERTAINMENT
  // ===========================================================================
  LIFE_MUSIC: {
    name: 'Music - Concert',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_CONCERT: {
    name: 'Concert - Live',
    category: 'Concert',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_GUITAR: {
    name: 'Guitar - Instrument',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_PIANO: {
    name: 'Piano - Keys',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_HEADPHONES: {
    name: 'Headphones - Audio',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1545127398-14699f9233423?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_MOVIE: {
    name: 'Movie - Cinema',
    category: 'Cinema',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFT_NETFLIX: {
    name: 'Netflix - Streaming',
    category: 'Streaming',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // SPORTS
  // ===========================================================================
  LIFE_FOOTBALL: {
    name: 'Football - Soccer',
    category: 'Football',
    image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_BASKETBALL: {
    name: 'Basketball - NBA',
    category: 'Basketball',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_TENNIS: {
    name: 'Tennis - Court',
    category: 'Tennis',
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_GOLF: {
    name: 'Golf - Course',
    category: 'Golf',
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_SWIMMING: {
    name: 'Swimming - Pool',
    category: 'Swimming',
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_CYCLING: {
    name: 'Cycling - Bike',
    category: 'Cycling',
    image: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // SHOPPING & RETAIL
  // ===========================================================================
  LIFE_SHOPPING: {
    name: 'Shopping - Mall',
    category: 'Shopping',
    image: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_STORE: {
    name: 'Store - Retail',
    category: 'Retail',
    image: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_MARKET: {
    name: 'Market - Grocery',
    category: 'Market',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_CART: {
    name: 'Shopping Cart',
    category: 'Shopping',
    image: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_SALE: {
    name: 'Sale - Discount',
    category: 'Sale',
    image: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // HOME & LIVING
  // ===========================================================================
  LIFE_HOME: {
    name: 'Home - House',
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFT_INTERIOR: {
    name: 'Interior - Design',
    category: 'Interior',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_GARDEN: {
    name: 'Garden - Plants',
    category: 'Garden',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_KITCHEN: {
    name: 'Kitchen - Cooking',
    category: 'Kitchen',
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_PET: {
    name: 'Pet - Dog Cat',
    category: 'Pet',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1920&q=80',
    source: 'Unsplash'
  },

  // ===========================================================================
  // SOCIAL & LIFESTYLE
  // ===========================================================================
  LIFE_SOCIAL: {
    name: 'Social - Media',
    category: 'Social',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFT_INSTAGRAM: {
    name: 'Instagram - Photo',
    category: 'Instagram',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_TIKTOK: {
    name: 'TikTok - Video',
    category: 'TikTok',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_YOUTUBE: {
    name: 'YouTube - Content',
    category: 'YouTube',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1920&q=80',
    source: 'Unsplash'
  },
  LIFE_TWITTER: {
    name: 'Twitter - X',
    category: 'Twitter',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1920&q=80',
    source: 'Unsplash'
  },
};

// =============================================================================
// EXPORTS - Toutes les collections Unsplash
// =============================================================================
export {
  ABSTRACT_IMAGES,
  ANIME_IMAGES,
  ANIMALS_IMAGES,
  ARCHITECTURE_IMAGES,
  ART_IMAGES,
  BUSINESS_IMAGES,
  CYBERPUNK_IMAGES,
  DEVOPS_IMAGES,
  ESPORT_IMAGES,
  FASHION_IMAGES,
  FOOD_IMAGES,
  NATURE_IMAGES,
  NEON_IMAGES,
  NIGHT_IMAGES,
  PEOPLE_IMAGES,
  SPACE_IMAGES,
  SPORTS_IMAGES,
  TECHNOLOGY_IMAGES,
  TRAVEL_IMAGES,
  VINTAGE_IMAGES,
  WALLPAPER_IMAGES,
  TECH_AI_IMAGES,
  DEVELOPMENT_IMAGES,
  SCIENCE_IMAGES,
  FINANCE_IMAGES,
  GAMING_IMAGES,
  LIFESTYLE_IMAGES,
};

// For backward compatibility - Collection complète
export const REAL_IMAGES = {
  ...ABSTRACT_IMAGES,
  ...ANIME_IMAGES,
  ...ANIMALS_IMAGES,
  ...ARCHITECTURE_IMAGES,
  ...ART_IMAGES,
  ...BUSINESS_IMAGES,
  ...CYBERPUNK_IMAGES,
  ...DEVOPS_IMAGES,
  ...ESPORT_IMAGES,
  ...FASHION_IMAGES,
  ...FOOD_IMAGES,
  ...NATURE_IMAGES,
  ...NEON_IMAGES,
  ...NIGHT_IMAGES,
  ...PEOPLE_IMAGES,
  ...SPACE_IMAGES,
  ...SPORTS_IMAGES,
  ...TECHNOLOGY_IMAGES,
  ...TRAVEL_IMAGES,
  ...VINTAGE_IMAGES,
  ...WALLPAPER_IMAGES,
  ...TECH_AI_IMAGES,
  ...DEVELOPMENT_IMAGES,
  ...SCIENCE_IMAGES,
  ...FINANCE_IMAGES,
  ...GAMING_IMAGES,
  ...LIFESTYLE_IMAGES,
};

// Collection spécifique pour les catégories principales (compatibilité)
export const ANIME_COLLECTION = ANIME_IMAGES;
export const CYBERPUNK_COLLECTION = CYBERPUNK_IMAGES;
export const DEVOPS_COLLECTION = DEVOPS_IMAGES;
export const NATURE_COLLECTION = NATURE_IMAGES;
export const ESPORT_COLLECTION = ESPORT_IMAGES;
