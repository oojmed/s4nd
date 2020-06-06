let adjectives = ['Sad', 'Sadistic', 'Gentle', 'Royal', 'Tasty', 'Quirky', 'Fast', 'Quick', 'Slow', 'Epic', 'Fantastic', 'Amazing', 'Cool', 'Wet', 'Poison', 'Chaotic', 'Nude', 'Old', 'New'];
let places = JSON.parse('["wood", "forest", "copse", "bush", "trees", "stand", "swamp", "marsh", "wetland", "fen", "bog", "moor", "heath", "fells", "morass", "jungle", "rainforest", "cloud", "forest", "plains", "fields", "grass", "grassland", "savannah", "flood", "plain", "flats", "prairie", "tundra", "iceberg", "glacier", "snowfields", "hills", "highland", "heights", "plateau", "badland", "kame", "shield", "downs", "downland", "ridge", "ridgeline", "hollow", "valley", "vale", "glen", "dell", "mountain", "peak", "summit", "rise", "pass", "notch", "crown", "mount", "switchback", "furth", "canyon", "cliff", "bluff", "ravine", "gully", "gulch", "gorge", "desert", "scrub", "waste", "wasteland", "sands", "dunes", "volcano", "crater", "cone", "geyser", "lava", "fields", "ocean", "sea", "coast", "beach", "shore", "strand", "bay", "port", "harbour", "fjord", "vike", "cove", "shoals", "lagoon", "firth", "bight", "sound", "strait", "gulf", "inlet", "loch", "bayou", "dock", "pier", "anchorage", "jetty", "wharf", "marina", "landing", "mooring", "berth", "quay", "staith", "river", "stream", "creek", "brook", "waterway", "rill", "delta", "bank", "runoff", "channel", "bend", "meander", "backwater", "lake", "pool", "pond", "dugout", "fountain", "spring", "watering", "oasis", "well", "cistern", "reservoir", "waterfall", "falls", "rapids", "cataract", "cascade", "bridge", "crossing", "causeway", "viaduct", "aquaduct", "ford", "ferry", "dam", "dike", "bar", "canal", "ditch", "peninsula", "isthmus", "island", "isle", "sandbar", "reef", "atoll", "archipelago", "cay", "shipwreck", "derelict", "clearing", "meadow", "grove", "glade", "ring", "ruin", "acropolis", "desolation", "remnant", "remains", "henge", "cairn", "circle", "mound", "barrow", "earthworks", "petroglyphs", "lookout", "aerie", "promontory", "outcropping", "ledge", "overhang", "mesa", "butte", "outland", "outback", "territory", "reaches", "wild", "wilderness", "expanse", "view", "vista", "tableau", "spectacle", "landscape", "seascape", "aurora", "landmark", "battlefield", "trenches", "gambit", "folly", "conquest", "claim", "muster", "post", "path", "road", "track", "route", "highway", "way", "trail", "lane", "thoroughfare", "pike", "alley", "street", "avenue", "boulevard", "promenade", "esplande", "boardwalk", "crossroad", "junction", "intersection", "turn", "corner", "plaza", "terrace", "square", "courtyard", "court", "park", "marketplace", "bazaar", "fairground", "realm", "land", "country", "nation", "state", "protectorate", "empire", "kingdom", "principality", "domain", "dominion", "demesne", "province", "county", "duchy", "barony", "baronetcy", "march", "canton", "earldom", "fief", "shire", "pit", "hole", "abyss", "sinkhole", "crack", "chasm", "scar", "rift", "trench", "fissure", "cavern", "cave", "gallery", "grotto", "karst", "mine", "quarry", "shaft", "vein", "darkness", "shadow", "depths", "void", "tomb", "grave", "crypt", "sepulchre", "mausoleum", "ossuary", "boneyard", "graveyard", "cemetery", "maze", "labyrinth", "nest", "burrow", "lair", "den", "warren", "roost", "rookery", "hibernaculum", "home", "rest", "hideout", "hideaway", "retreat", "resting place", "safehouse", "sanctuary", "respite", "lodge", "slum", "shantytown", "ghetto", "camp", "meeting place", "bivouac", "campsite", "encampment", "tepee", "tent", "wigwam", "shelter", "yurt", "house", "mansion", "estate", "villa", "hut", "palace", "outbuilding", "shack", "tenement", "hovel", "manse", "manor", "longhouse", "cottage", "cabin", "parsonage", "rectory", "vicarge", "friary", "priory", "abbey", "monastery", "nunnery", "cloister", "convent", "hermitage", "castle", "keep", "fort", "fortress", "citadel", "bailey", "motte", "stronghold", "hold", "chateau", "outpost", "redoubt", "town", "village", "hamlet", "city", "metropolis", "settlement", "commune", "temple", "shrine", "church", "cathedral", "tabernacle", "ark", "sanctum", "parish", "chapel", "synagogue", "mosque", "pyramid", "ziggurat", "prison", "jail", "dungeon", "oubliette", "hospital", "hospice", "stocks", "gallows", "asylum", "madhouse", "bedlam", "vault", "treasury", "warehouse", "cellar", "relicry", "repository", "barracks", "armoury", "sewer", "gutter", "catacombs", "dump", "middens", "pipes", "baths", "heap", "mill", "windmill", "sawmill", "smithy", "forge", "workshop", "brickyard", "shipyard", "forgeworks", "foundry", "bakery", "brewery", "almshouse", "counting house", "courthouse", "apothecary", "haberdashery", "cobbler", "garden", "menagerie", "zoo", "aquarium", "terrarium", "conservatory", "lawn", "greenhouse", "farm", "orchard", "vineyard", "ranch", "apiary", "farmstead", "homestead", "pasture", "commons", "granary", "silo", "crop", "barn", "stable", "pen", "kennel", "mews", "hutch", "pound", "coop", "stockade", "yard", "lumberyard", "tavern", "inn", "pub", "brothel", "whorehouse", "cathouse", "discotheque", "lighthouse", "beacon", "amphitheatre", "colosseum", "stadium", "arena", "circus", "academy", "university", "campus", "college", "library", "scriptorium", "laboratory", "observatory", "museum", "hall", "chamber", "room", "nave", "aisle", "vestibule", "antechamber", "chantry", "pulpit", "dome", "arch", "colonnade", "stair", "ladder", "climb", "ramp", "steps", "portal", "mouth", "opening", "door", "gate", "entrance", "maw", "tunnel", "passage", "corridor", "hallway", "chute", "slide", "tube", "trapdoor", "tower", "turret", "belfry", "wall", "fortifications", "ramparts", "pallisade", "battlements", "portcullis", "barbican", "throne room", "ballroom", "roof", "rooftops", "chimney", "attic", "loft", "gable", "eaves", "belvedere", "balcony", "balustrade", "parapet", "walkway", "catwalk", "pavillion", "pagoda", "gazebo", "mirror", "glass", "mere", "throne", "seat", "dais", "pillar", "column", "stone", "spike", "rock", "megalith", "menhir", "dolmen", "obelisk", "statue", "giant", "head", "arm", "leg", "body", "chest", "body", "face", "visage", "gargoyle", "grotesque", "fire", "flame", "bonfire", "hearth", "fireplace", "furnace", "stove", "window", "grate", "peephole", "arrowslit", "slit", "balistraria", "lancet", "aperture", "dormer"]'); //['Ocean', 'Lake', 'House', 'Dump', 'Dimension', 'Lair', 'Galaxy', 'Beach', 'Interior', 'City', 'Place', 'Town', 'Village', 'Kingdom', 'Ruins', 'Fjord', 'District', 'Mound', 'Land', 'Island'];
let after = ['Movement', 'Motion', 'Gesture', 'Development', 'Fear', 'Crime', 'Good', 'Regret', 'Suffering', 'Pain'];

/*
adjective noun
the adjective noun

[the] [adjective] noun [of / the noun]

the adjective of noun

noun of noun
adjective noun of noun

the noun of the noun
noun of the noun
*/

function range(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function choose(arr) {
  return arr[range(0, arr.length)];
}

export function generate() {
  let final = '';
  let isOf = Math.random() > 0.5;

  if (Math.random() > 0.5) {
    final += 'The ';
  }

  if (!isOf || (isOf && Math.random() > 0.5)) {
    final += `${choose(adjectives)} `;
  }

  let p = choose(places);
  p = p[0].toUpperCase() + p.substring(1);

  final += p;

  if (isOf) {
    final += ` of ${choose(after)}`;
  }

  return final;
}

window.generate = generate;
