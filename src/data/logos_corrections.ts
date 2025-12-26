// ============================================================================
// CORRECTIONS DES LOGOS - URLS MISES À JOUR
// ============================================================================
//
// Ce fichier contient les corrections d'URLs et les nouvelles sources d'images.
//
// NOUVEAUX DOMAINES AUTORISÉS:
// =============================
// - raw.githubusercontent.com (PokeAPI sprites)
// - img.pokemondb.net (Types Pokémon)
// - cdn.cloudflare.steamstatic.com (Steam capsules)
// - cdn.jsdelivr.net, unpkg.com (NPM CDNs)
// - img.icons8.com (Icons8)
//
// NOUVELLES SOURCES AJOUTÉES:
// =============================
// 1. POKEMON_LOGOS - Types, sprites PokeAPI, Pokéballs, services
// 2. ANIME_LOGOS - Services anime, streaming, studios, genres
// 3. STEAM_LOGOS - Plateforme Steam, jeux populaires
// 4. DEVOPS_LOGOS - Cloud, containers, IaC, CI/CD, monitoring
// 5. ESPORT_LOGOS - Plateformes, jeux, équipes, streaming
//
// ============================================================================

// URLs Coingecko corrigées (remplacer dans logos.ts)
const COINGECKO_FIXES: Record<string, string> = {
  // Remplacer les URLs cassées par les nouveaux IDs Coingecko ou alternatives
  ALGO: 'https://assets.coingecko.com/coins/images/4027/small/algorand-logo.png?1696505158',
  FLOW: 'https://assets.coingecko.com/coins/images/13750/small/FLOW_logo.png?1696503969',
  EGLD: 'https://assets.coingecko.com/coins/images/12643/small/multiversx-egld-logo.png?1696506134',
  IOTA: 'https://assets.coingecko.com/coins/images/692/small/iota.png?1696502094',
  ARB: 'https://assets.coingecko.com/coins/images/16547/small/Arbitrum.png?1696504180',
  OP: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png?1696507940',
  IMX: 'https://assets.coingecko.com/coins/images/17233/small/immutable-x.png?1696507090',
  VET: 'https://assets.coingecko.com/coins/images/1167/small/Vechain_Logo.png?1696503760',
  ETC: 'https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png?1696502445',
  COMP: 'https://assets.coingecko.com/coins/images/10772/small/compound.png?1696508693',
  SUSHI: 'https://assets.coingecko.com/coins/images/12271/small/Sushi.png?1696506508',
  YFI: 'https://assets.coingecko.com/coins/images/5864/small/YFI.png?1696508251',
  LDO: 'https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png?1696507085',
  RPL: 'https://assets.coingecko.com/coins/images/2090/small/Rocket_Pool.png?1696505390',
  DAI: 'https://assets.coingecko.com/coins/images/5368/small/dai.png?1696503789',
  BUSD: 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png?1696503765',
  FRAX: 'https://assets.coingecko.com/coins/images/13423/small/Frax.png?1696504222',
  SAND: 'https://assets.coingecko.com/coins/images/8273/small/The_Sandbox_logo.png?1696506513',
  MANA: 'https://assets.coingecko.com/coins/images/1184/small/decentraland-mana.png?1696504435',
  AXS: 'https://assets.coingecko.com/coins/images/13029/small/axie-infinity.png?1696506797',
  GALA: 'https://assets.coingecko.com/coins/images/12433/small/Gala.png?1696506594',
  AR: 'https://assets.coingecko.com/coins/images/9043/small/arweave.png?1696502536',
  RNDR: 'https://assets.coingecko.com/coins/images/4169/small/render-token.png?1696508207',
  GRT: 'https://assets.coingecko.com/coins/images/6719/small/The_Graph.png?1696504052',
  FLOKI: 'https://assets.coingecko.com/coins/images/16742/small/Floki.png?1696506535',
  BONK: 'https://assets.coingecko.com/coins/images/28600/small/bonk.png?1696506794',
  ZEC: 'https://assets.coingecko.com/coins/images/134/small/zcash.png?1696502094',
  CRO: 'https://assets.coingecko.com/coins/images/7310/small/cronos.png?1696504118',
  LEO: 'https://assets.coingecko.com/coins/images/8418/small/leo-token.png?1696508185',
  CAKE: 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake.png?1696506499',
  THETA: 'https://assets.coingecko.com/coins/images/2538/small/theta-token.png?1696508433',
  APT: 'https://assets.coingecko.com/coins/images/26455/small/Aptos.png?1696504756',
  SUI: 'https://assets.coingecko.com/coins/images/26375/small/sui.png?1696508399',
  SEI: 'https://assets.coingecko.com/coins/images/28295/small/Sei.png?1696508357',
  INJ: 'https://assets.coingecko.com/coins/images/12882/small/injective.png?1696504539',
  TIA: 'https://assets.coingecko.com/coins/images/31967/small/celestia.png?1696507025',
  WLD: 'https://assets.coingecko.com/coins/images/29670/small/worldcoin.png?1696508519',
  BCH: 'https://assets.coingecko.com/coins/images/1232/small/bitcoin-cash.png?1696502069',
};

// URLs SimpleIcons corrigées
const SIMPLEICONS_FIXES: Record<string, string> = {
  MSFT: 'https://cdn.simpleicons.org/microsoft/256.png',
  AMZN: 'https://cdn.simpleicons.org/amazon/256.png',
  JPM: 'https://cdn.simpleicons.org/jpmorgan/256.png',
  WMT: 'https://cdn.simpleicons.org/walmart/256.png',
  XOM: 'https://cdn.simpleicons.org/exxon/256.png',
  CVX: 'https://cdn.simpleicons.org/chevron/256.png',
  PEP: 'https://cdn.simpleicons.org/pepsico/256.png',
};

// Remplacer les URLs Clearbit par des alternatives
const CLEARBIT_ALTERNATIVES: Record<string, string> = {
  BRK: 'https://cdn.simpleicons.org/berkshirehathaway/256.png', // Utiliser SimpleIcons si disponible
  JNJ: 'https://cdn.simpleicons.org/johnsonandjohnson/256.png',
  HD: 'https://cdn.simpleicons.org/homedepot/256.png',
  PG: 'https://cdn.simpleicons.org/pg/256.png',
  MRK: 'https://cdn.simpleicons.org/merck/256.png',
  ABBV: 'https://cdn.simpleicons.org/abbvie/256.png',
  LLY: 'https://cdn.simpleicons.org/lilly/256.png',
  BMY: 'https://cdn.simpleicons.org/bms/256.png',
  TMO: 'https://cdn.simpleicons.org/thermofisher/256.png',
  ABT: 'https://cdn.simpleicons.org/abbott/256.png',
  DHR: 'https://cdn.simpleicons.org/danaher/256.png',
  LIN: 'https://cdn.simpleicons.org/linde/256.png',
  BLK: 'https://cdn.simpleicons.org/blackrock/256.png',
  LCID: 'https://cdn.simpleicons.org/lucid/256.png',
  NIO: 'https://cdn.simpleicons.org/nio/256.png',
};

// URLs MISC corrigées
const MISC_FIXES: Record<string, string> = {
  LINKEDIN: 'https://cdn.simpleicons.org/linkedin/256.png',
};

// ============================================================================
// NOUVELLES SOURCES D'IMAGES AJOUTÉES (2024)
// ============================================================================

// Pokémon - PokeAPI & PokemonDB
const POKEMON_SOURCES: Record<string, string> = {
  // Types Pokémon (PokemonDB)
  POKEMON_TYPE_BASE: 'https://img.pokemondb.net/sprites/types/',

  // Sprites officiels PokeAPI
  POKEAPI_BASE: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/',
  POKEAPI_POKEMON: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/',
  POKEAPI_ITEMS: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/',
};

// Anime & Streaming
const ANIME_SOURCES: Record<string, string> = {
  // Services anime
  MYANIMELIST: 'https://cdn.simpleicons.org/myanimelist/256.png',
  ANILIST: 'https://cdn.simpleicons.org/anilist/256.png',
  KITSU: 'https://cdn.simpleicons.org/kitsu/256.png',

  // Streaming
  CRUNCHYROLL: 'https://cdn.simpleicons.org/crunchyroll/256.png',
  FUNIMATION: 'https://cdn.simpleicons.org/funimation/256.png',
  HIDIVE: 'https://cdn.simpleicons.org/hidive/256.png',
};

// Steam & Gaming PC
const STEAM_SOURCES: Record<string, string> = {
  STEAM_BASE: 'https://cdn.simpleicons.org/steam/256.png',
  STEAM_CDN: 'https://cdn.cloudflare.steamstatic.com/steam/apps/',
  VALVE: 'https://cdn.simpleicons.org/valve/256.png',
};

// DevOps & Cloud
const DEVOPS_SOURCES: Record<string, string> = {
  // Cloud Providers
  AWS: 'https://cdn.simpleicons.org/amazonaws/256.png',
  AZURE: 'https://cdn.simpleicons.org/microsoftazure/256.png',
  GCP: 'https://cdn.simpleicons.org/googlecloud/256.png',
  DIGITALOCEAN: 'https://cdn.simpleicons.org/digitalocean/256.png',
  LINODE: 'https://cdn.simpleicons.org/linode/256.png',
  VULTR: 'https://cdn.simpleicons.org/vultr/256.png',
  HETZNER: 'https://cdn.simpleicons.org/hetzner/256.png',
  OVH: 'https://cdn.simpleicons.org/ovh/256.png',
  SCALEWAY: 'https://cdn.simpleicons.org/scaleway/256.png',

  // Containers
  DOCKER: 'https://cdn.simpleicons.org/docker/256.png',
  KUBERNETES: 'https://cdn.simpleicons.org/kubernetes/256.png',
  PODMAN: 'https://cdn.simpleicons.org/podman/256.png',
  HELM: 'https://cdn.simpleicons.org/helm/256.png',

  // IaC
  TERRAFORM: 'https://cdn.simpleicons.org/terraform/256.png',
  ANSIBLE: 'https://cdn.simpleicons.org/ansible/256.png',
  PUPPET: 'https://cdn.simpleicons.org/puppet/256.png',
  CHEF: 'https://cdn.simpleicons.org/chef/256.png',
  PACKER: 'https://cdn.simpleicons.org/packer/256.png',
  VAGRANT: 'https://cdn.simpleicons.org/vagrant/256.png',

  // CI/CD
  JENKINS: 'https://cdn.simpleicons.org/jenkins/256.png',
  GITLAB_CI: 'https://cdn.simpleicons.org/gitlab/256.png',
  TRAVIS_CI: 'https://cdn.simpleicons.org/travisci/256.png',
  CIRCLE_CI: 'https://cdn.simpleicons.org/circleci/256.png',
  GITHUB_ACTIONS: 'https://cdn.simpleicons.org/githubactions/256.png',
  AZURE_DEVOPS: 'https://cdn.simpleicons.org/azuredevops/256.png',
  BUILDKITE: 'https://cdn.simpleicons.org/buildkite/256.png',

  // Monitoring
  PROMETHEUS: 'https://cdn.simpleicons.org/prometheus/256.png',
  GRAFANA: 'https://cdn.simpleicons.org/grafana/256.png',
  DATADOG: 'https://cdn.simpleicons.org/datadog/256.png',
  NEWRELIC: 'https://cdn.simpleicons.org/newrelic/256.png',
  SPLUNK: 'https://cdn.simpleicons.org/splunk/256.png',
  ELASTIC: 'https://cdn.simpleicons.org/elastic/256.png',
  KIBANA: 'https://cdn.simpleicons.org/kibana/256.png',
  ZABBIX: 'https://cdn.simpleicons.org/zabbix/256.png',
  NAGIOS: 'https://cdn.simpleicons.org/nagios/256.png',
};

// ESports
const ESPORT_SOURCES: Record<string, string> = {
  // Plateformes
  ESL: 'https://cdn.simpleicons.org/esl/256.png',
  FACEIT: 'https://cdn.simpleicons.org/faceit/256.png',
  ESEA: 'https://cdn.simpleicons.org/esea/256.png',
  TOORNAMENT: 'https://cdn.simpleicons.org/toornament/256.png',
  BATTLEFY: 'https://cdn.simpleicons.org/battlefy/256.png',
  SMASH_GG: 'https://cdn.simpleicons.org/smashgg/256.png',
  START_GG: 'https://cdn.simpleicons.org/startgg/256.png',

  // Jeux
  VALORANT: 'https://cdn.simpleicons.org/valorant/256.png',
  CSGO: 'https://cdn.simpleicons.org/csgo/256.png',
  LEAGUE_OF_LEGENDS: 'https://cdn.simpleicons.org/leagueoflegends/256.png',
  DOTA2: 'https://cdn.simpleicons.org/dota2/256.png',
  OVERWATCH: 'https://cdn.simpleicons.org/overwatch/256.png',
  RAINBOW_SIX: 'https://cdn.simpleicons.org/rainbow6/256.png',
  CALLOFDUTY: 'https://cdn.simpleicons.org/callofduty/256.png',
  STREETFIGHTER: 'https://cdn.simpleicons.org/streetfighter/256.png',
  TEKKEN: 'https://cdn.simpleicons.org/tekken/256.png',

  // Équipes
  CLOUD9: 'https://cdn.simpleicons.org/cloud9/256.png',
  TEAM_LIQUID: 'https://cdn.simpleicons.org/teamliquid/256.png',
  FNATIC: 'https://cdn.simpleicons.org/fnatic/256.png',
  G2_ESPORTS: 'https://cdn.simpleicons.org/g2/256.png',
  T1: 'https://cdn.simpleicons.org/t1/256.png',
  NAVI: 'https://cdn.simpleicons.org/natusvincere/256.png',
  FAZE_CLAN: 'https://cdn.simpleicons.org/fazeclan/256.png',
  THIEVES: 'https://cdn.simpleicons.org/100thieves/256.png',
  SENTINELS: 'https://cdn.simpleicons.org/sentinels/256.png',
  OG: 'https://cdn.simpleicons.org/og/256.png',
};

// ============================================================================
// RÉSUMÉ DES SOURCES PAR DOMAINE
// ============================================================================

const DOMAIN_SUMMARY = {
  // Domaines existants
  'assets.coingecko.com': 'Cryptomonnaies - Logos officiels',
  'cdn.simpleicons.org': 'Icônes SVG - Tech, Social, Gaming, DevOps',
  'logo.clearbit.com': 'Entreprises - Logos professionnels',
  'images.unsplash.com': 'Photos - Images thématiques',
  'minecraft.wiki': 'Minecraft - Assets wiki officiel',
  'assets.minecrafthub.com': 'Minecraft - Hub communautaire',
  'image.api.playstation.com': 'PlayStation - API officielle',

  // Nouveaux domaines ajoutés
  'raw.githubusercontent.com': 'PokeAPI - Sprites Pokémon officiels',
  'img.pokemondb.net': 'PokemonDB - Types et informations',
  'cdn.cloudflare.steamstatic.com': 'Steam - Capsules de jeux',
  'cdn.jsdelivr.net': 'NPM CDN - Packages JavaScript',
  'unpkg.com': 'NPM CDN - Packages JavaScript',
  'img.icons8.com': 'Icons8 - Icônes professionnelles',
} as const;

// Export des sources pour référence
export {
  COINGECKO_FIXES,
  SIMPLEICONS_FIXES,
  CLEARBIT_ALTERNATIVES,
  MISC_FIXES,
  POKEMON_SOURCES,
  ANIME_SOURCES,
  STEAM_SOURCES,
  DEVOPS_SOURCES,
  ESPORT_SOURCES,
  DOMAIN_SUMMARY,
};

console.log('CORRECTIONS PRÊTES À APPLIQUER');
console.log(`Coingecko fixes: ${Object.keys(COINGECKO_FIXES).length}`);
console.log(`SimpleIcons fixes: ${Object.keys(SIMPLEICONS_FIXES).length}`);
console.log(`Clearbit alternatives: ${Object.keys(CLEARBIT_ALTERNATIVES).length}`);
console.log(`MISC fixes: ${Object.keys(MISC_FIXES).length}`);
console.log('---');
console.log('NOUVELLES SOURCES AJOUTÉES:');
console.log(`Pokémon sources: ${Object.keys(POKEMON_SOURCES).length}`);
console.log(`Anime sources: ${Object.keys(ANIME_SOURCES).length}`);
console.log(`Steam sources: ${Object.keys(STEAM_SOURCES).length}`);
console.log(`DevOps sources: ${Object.keys(DEVOPS_SOURCES).length}`);
console.log(`ESport sources: ${Object.keys(ESPORT_SOURCES).length}`);
console.log('---');
console.log(`Domaines totaux: ${Object.keys(DOMAIN_SUMMARY).length}`);
console.log('Domaines nouvellement ajoutés: raw.githubusercontent.com, img.pokemondb.net, cdn.cloudflare.steamstatic.com, cdn.jsdelivr.net, unpkg.com, img.icons8.com');
