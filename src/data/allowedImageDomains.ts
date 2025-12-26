// ============================================================================
// DOMAINES AUTORISÉS POUR LES IMAGES DISCORD
// ============================================================================
//
// Liste des domaines autorisés pour les images utilisées dans les embeds Discord.
// Ces domaines sont considérés comme fiables et stables.
//
// Pour ajouter un nouveau domaine:
// 1. Vérifiez que le CDN est fiable et public
// 2. Ajoutez-le à la catégorie appropriée
// 3. Documentez le type de contenu
//
// ============================================================================

export const ALLOWED_IMAGE_DOMAINS = {
  // === CRYPTO & WEB3 ===
  crypto: [
    'assets.coingecko.com',
    's2.coinmarketcap.com',
    'cryptologos.cc',
    'token-icons.lido.fi',
  ],

  // === ICÔNES SVG & LOGOS ===
  icons: [
    'cdn.simpleicons.org',
    'img.icons8.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
  ],

  // === ENTREPRISES & SERVICES ===
  companies: [
    'logo.clearbit.com',
    'logo.tiny.us',
    'worldvectorlogo.com',
  ],

  // === PHOTOS & IMAGES THÉMATIQUES ===
  photos: [
    'images.unsplash.com',
    'images.pexels.com',
    'cdn.pixabay.com',
    'loremflickr.com',
    'placehold.co',
  ],

  // === GAMING ===
  gaming: {
    minecraft: [
      'minecraft.wiki',
      'assets.minecrafthub.com',
      'image.api.playstation.com',
      'www.minecraft.net',
    ],
    pokemon: [
      'raw.githubusercontent.com', // PokeAPI sprites
      'img.pokemondb.net',
    ],
    platforms: [
      'cdn.cloudflare.steamstatic.com',
      'store.cloudflare.steamstatic.com',
      'static.wikia.nocookie.net',
    ],
    servers: [
      'playhive.com',
      'mineplex.com',
      'cubecraft.net',
      'wynncraft.com',
      'wookiecraft.com',
    ],
  },

  // === TECH & DEVOPS ===
  tech: [
    'fabricmc.net',
    'quiltmc.org',
    'cdn.terraform.io',
    'julialang.org',
  ],

  // === ANIMES & MANGA ===
  anime: [
    'cdn.myanimelist.net',
    'api.jikan.moe',
    'uploads.mangadex.org',
  ],

  // === WALLPAPERS & ARTWORKS ===
  // NOTE: Wallhacken retiré - ne fonctionne pas avec Discord
  // Utilisez Unsplash pour les wallpapers

  // === GAME ASSETS ===
  // NOTE: Steam retiré - ne fonctionne pas avec Discord
  // Utilisez Unsplash pour les images de jeux
} as const;

// Type pour les domaines autorisés
export type AllowedDomain = typeof ALLOWED_IMAGE_DOMAINS;

// Fonction pour vérifier si un domaine est autorisé
export function isDomainAllowed(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // D'abord, utiliser getDomainCategory pour vérifier rapidement
    const category = getDomainCategory(url);
    if (category) return true;

    return false;
  } catch {
    return false;
  }
}

// Fonction pour obtenir la catégorie d'un domaine
export function getDomainCategory(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    for (const [category, domains] of Object.entries(ALLOWED_IMAGE_DOMAINS)) {
      if (Array.isArray(domains)) {
        if (domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
          return category;
        }
      } else {
        for (const [subCategory, subDomains] of Object.entries(domains)) {
          if (Array.isArray(subDomains)) {
            if (subDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
              return `${category}.${subCategory}`;
            }
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Liste plate de tous les domaines autorisés (pour vérification rapide)
export function getAllowedDomainList(): string[] {
  const domains: string[] = [];

  for (const category of Object.values(ALLOWED_IMAGE_DOMAINS)) {
    if (Array.isArray(category)) {
      domains.push(...category);
    } else {
      for (const subCategory of Object.values(category)) {
        if (Array.isArray(subCategory)) {
          domains.push(...subCategory);
        }
      }
    }
  }

  return domains;
}

// Export par défaut
export default ALLOWED_IMAGE_DOMAINS;
