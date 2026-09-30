/** Lexique Cemantik — mots FR + tags pour proximité sémantique. */

export type LexEntry = {
  word: string;
  tags: string[];
};

/** Mots jouables (cibles + guesses autorisés). */
export const CEMANTIK_LEXICON: LexEntry[] = [
  // nature
  { word: "arbre", tags: ["nature", "plante", "bois", "foret"] },
  { word: "foret", tags: ["nature", "plante", "bois", "arbre"] },
  { word: "feuille", tags: ["nature", "plante", "arbre", "vert"] },
  { word: "fleur", tags: ["nature", "plante", "jardin", "parfum"] },
  { word: "jardin", tags: ["nature", "plante", "maison", "fleur"] },
  { word: "herbe", tags: ["nature", "plante", "vert", "jardin"] },
  { word: "montagne", tags: ["nature", "relief", "hauteur", "pierre"] },
  { word: "riviere", tags: ["nature", "eau", "cours", "poisson"] },
  { word: "ocean", tags: ["nature", "eau", "mer", "vague"] },
  { word: "mer", tags: ["nature", "eau", "ocean", "plage"] },
  { word: "plage", tags: ["nature", "eau", "sable", "mer"] },
  { word: "soleil", tags: ["nature", "ciel", "chaleur", "lumiere"] },
  { word: "lune", tags: ["nature", "ciel", "nuit", "astre"] },
  { word: "etoile", tags: ["nature", "ciel", "nuit", "astre"] },
  { word: "nuage", tags: ["nature", "ciel", "pluie", "vent"] },
  { word: "pluie", tags: ["nature", "eau", "ciel", "nuage"] },
  { word: "neige", tags: ["nature", "froid", "hiver", "blanc"] },
  { word: "vent", tags: ["nature", "air", "ciel", "tempete"] },
  { word: "pierre", tags: ["nature", "minéral", "solide", "montagne"] },
  { word: "feu", tags: ["nature", "chaleur", "flammes", "danger"] },

  // animaux
  { word: "chat", tags: ["animal", "mammal", "domestique", "félin"] },
  { word: "chien", tags: ["animal", "mammal", "domestique", "fidèle"] },
  { word: "loup", tags: ["animal", "mammal", "sauvage", "félin"] },
  { word: "lion", tags: ["animal", "mammal", "sauvage", "félin"] },
  { word: "oiseau", tags: ["animal", "vol", "ailes", "ciel"] },
  { word: "poisson", tags: ["animal", "eau", "nage", "mer"] },
  { word: "cheval", tags: ["animal", "mammal", "ferme", "course"] },
  { word: "vache", tags: ["animal", "mammal", "ferme", "lait"] },
  { word: "abeille", tags: ["animal", "insecte", "miel", "fleur"] },
  { word: "serpent", tags: ["animal", "reptile", "danger", "sauvage"] },

  // corps / humain
  { word: "main", tags: ["corps", "humain", "toucher", "doigt"] },
  { word: "oeil", tags: ["corps", "humain", "voir", "visage"] },
  { word: "coeur", tags: ["corps", "humain", "amour", "vie"] },
  { word: "tete", tags: ["corps", "humain", "esprit", "visage"] },
  { word: "pied", tags: ["corps", "humain", "marche", "chaussure"] },
  { word: "voix", tags: ["corps", "humain", "son", "parole"] },
  { word: "sang", tags: ["corps", "humain", "vie", "rouge"] },
  { word: "peau", tags: ["corps", "humain", "toucher", "surface"] },

  // maison / objets
  { word: "maison", tags: ["habitat", "batiment", "famille", "toit"] },
  { word: "porte", tags: ["habitat", "ouverture", "maison", "entrer"] },
  { word: "fenetre", tags: ["habitat", "ouverture", "maison", "verre"] },
  { word: "table", tags: ["meuble", "maison", "manger", "bois"] },
  { word: "chaise", tags: ["meuble", "maison", "assis", "bois"] },
  { word: "lit", tags: ["meuble", "maison", "sommeil", "nuit"] },
  { word: "livre", tags: ["objet", "lire", "savoir", "papier"] },
  { word: "cle", tags: ["objet", "porte", "ouvrir", "metal"] },
  { word: "lampe", tags: ["objet", "lumiere", "maison", "nuit"] },
  { word: "miroir", tags: ["objet", "reflet", "verre", "visage"] },
  { word: "verre", tags: ["objet", "boire", "fragile", "eau"] },
  { word: "couteau", tags: ["objet", "couper", "cuisine", "metal"] },
  { word: "horloge", tags: ["objet", "temps", "heure", "maison"] },

  // nourriture
  { word: "pain", tags: ["nourriture", "manger", "blé", "boulangerie"] },
  { word: "eau", tags: ["nature", "boire", "liquide", "vie"] },
  { word: "lait", tags: ["nourriture", "boire", "blanc", "vache"] },
  { word: "fromage", tags: ["nourriture", "manger", "lait", "france"] },
  { word: "pomme", tags: ["nourriture", "fruit", "manger", "arbre"] },
  { word: "raisin", tags: ["nourriture", "fruit", "vin", "vigne"] },
  { word: "vin", tags: ["nourriture", "boire", "raisin", "rouge"] },
  { word: "cafe", tags: ["nourriture", "boire", "chaud", "matin"] },
  { word: "sucre", tags: ["nourriture", "doux", "cuisine", "blanc"] },
  { word: "sel", tags: ["nourriture", "cuisine", "saveur", "mer"] },
  { word: "soupe", tags: ["nourriture", "manger", "chaud", "bol"] },
  { word: "riz", tags: ["nourriture", "manger", "grain", "asie"] },

  // ville / société
  { word: "ville", tags: ["lieu", "urbain", "maison", "rue"] },
  { word: "rue", tags: ["lieu", "urbain", "ville", "marche"] },
  { word: "ecole", tags: ["lieu", "savoir", "enfant", "livre"] },
  { word: "hopital", tags: ["lieu", "sante", "soin", "médecin"] },
  { word: "marche", tags: ["lieu", "ville", "acheter", "nourriture"] },
  { word: "travail", tags: ["societe", "métier", "argent", "temps"] },
  { word: "argent", tags: ["societe", "valeur", "acheter", "travail"] },
  { word: "roi", tags: ["societe", "pouvoir", "couronne", "histoire"] },
  { word: "guerre", tags: ["societe", "conflit", "danger", "armée"] },
  { word: "paix", tags: ["societe", "calme", "accord", "guerre"] },
  { word: "loi", tags: ["societe", "regle", "justice", "etat"] },
  { word: "musique", tags: ["art", "son", "voix", "rythme"] },
  { word: "danse", tags: ["art", "mouvement", "musique", "corps"] },
  { word: "peinture", tags: ["art", "couleur", "image", "toile"] },
  { word: "film", tags: ["art", "image", "histoire", "ecran"] },

  // tech / moderne
  { word: "ordinateur", tags: ["tech", "machine", "ecran", "code"] },
  { word: "telephone", tags: ["tech", "appel", "ecran", "portable"] },
  { word: "reseau", tags: ["tech", "lien", "internet", "connexion"] },
  { word: "jeu", tags: ["loisir", "amusement", "regle", "score"] },
  { word: "robot", tags: ["tech", "machine", "automatique", "futur"] },
  { word: "fusee", tags: ["tech", "espace", "vol", "futur"] },
  { word: "train", tags: ["transport", "voyage", "rail", "vitesse"] },
  { word: "avion", tags: ["transport", "voyage", "ciel", "vol"] },
  { word: "voiture", tags: ["transport", "voyage", "route", "moteur"] },
  { word: "bateau", tags: ["transport", "voyage", "eau", "mer"] },
  { word: "route", tags: ["transport", "voyage", "ville", "voiture"] },

  // abstractions / émotions
  { word: "amour", tags: ["emotion", "lien", "coeur", "doux"] },
  { word: "peur", tags: ["emotion", "danger", "froid", "nuit"] },
  { word: "joie", tags: ["emotion", "rire", "bonheur", "lumiere"] },
  { word: "colere", tags: ["emotion", "feu", "conflit", "rouge"] },
  { word: "reve", tags: ["esprit", "nuit", "sommeil", "image"] },
  { word: "idee", tags: ["esprit", "pensee", "creer", "lumiere"] },
  { word: "temps", tags: ["abstract", "heure", "horloge", "passe"] },
  { word: "espace", tags: ["abstract", "ciel", "univers", "vide"] },
  { word: "silence", tags: ["abstract", "son", "calme", "nuit"] },
  { word: "vitesse", tags: ["abstract", "mouvement", "rapide", "temps"] },
  { word: "ombre", tags: ["abstract", "lumiere", "noir", "forme"] },
  { word: "lumiere", tags: ["abstract", "voir", "soleil", "lampe"] },
  { word: "couleur", tags: ["abstract", "voir", "peinture", "teint"] },
  { word: "nombre", tags: ["abstract", "math", "compter", "ordre"] },
  { word: "mot", tags: ["langage", "parole", "livre", "idee"] },
  { word: "secret", tags: ["abstract", "cache", "mystere", "silence"] },
  { word: "hasard", tags: ["abstract", "jeu", "imprevu", "destin"] },
  { word: "destin", tags: ["abstract", "futur", "chemin", "hasard"] },
  { word: "memoire", tags: ["esprit", "passe", "souvenir", "cerveau"] },
  { word: "courage", tags: ["emotion", "force", "peur", "héros"] },

  // extras for denser graph
  { word: "pont", tags: ["batiment", "ville", "riviere", "lien"] },
  { word: "tour", tags: ["batiment", "pierre", "histoire", "roi"] },
  { word: "pontife", tags: ["religion", "pouvoir", "rituel"] },
  { word: "eglise", tags: ["batiment", "religion", "pierre", "silence"] },
  { word: "temple", tags: ["batiment", "religion", "pierre", "rituel"] },
  { word: "marcheur", tags: ["humain", "pied", "route", "voyage"] },
  { word: "voyage", tags: ["transport", "chemin", "decouverte", "temps"] },
  { word: "carte", tags: ["objet", "voyage", "lieu", "papier"] },
  { word: "boussole", tags: ["objet", "voyage", "direction", "nord"] },
  { word: "ancre", tags: ["objet", "bateau", "mer", "metal"] },
  { word: "voile", tags: ["bateau", "vent", "mer", "tissu"] },
  { word: "phare", tags: ["lumiere", "mer", "batiment", "nuit"] },
  { word: "orage", tags: ["nature", "ciel", "pluie", "tonnerre"] },
  { word: "tonnerre", tags: ["nature", "ciel", "son", "orage"] },
  { word: "eclaire", tags: ["nature", "ciel", "lumiere", "orage"] },
  { word: "desert", tags: ["nature", "sable", "chaleur", "vide"] },
  { word: "oasis", tags: ["nature", "eau", "desert", "palme"] },
  { word: "glace", tags: ["nature", "froid", "eau", "hiver"] },
  { word: "brume", tags: ["nature", "air", "matin", "cacher"] },
  { word: "aurore", tags: ["nature", "ciel", "matin", "lumiere"] },
  { word: "crepuscule", tags: ["nature", "ciel", "soir", "ombre"] },
  { word: "horizon", tags: ["nature", "ciel", "loin", "ligne"] },
  { word: "echo", tags: ["son", "repete", "montagne", "silence"] },
  { word: "rythme", tags: ["musique", "temps", "danse", "pulsation"] },
  { word: "melodie", tags: ["musique", "son", "doux", "voix"] },
  { word: "instrument", tags: ["musique", "objet", "jouer", "son"] },
  { word: "piano", tags: ["musique", "instrument", "touche", "salon"] },
  { word: "guitare", tags: ["musique", "instrument", "corde", "chanson"] },
  { word: "chanson", tags: ["musique", "voix", "parole", "melodie"] },
  { word: "poeme", tags: ["art", "mot", "emotion", "livre"] },
  { word: "roman", tags: ["art", "livre", "histoire", "lire"] },
  { word: "theatre", tags: ["art", "scene", "acteur", "histoire"] },
  { word: "acteur", tags: ["art", "film", "theatre", "role"] },
  { word: "scene", tags: ["art", "theatre", "lumiere", "public"] },
  { word: "public", tags: ["societe", "foule", "spectacle", "voir"] },
  { word: "foule", tags: ["societe", "ville", "monde", "bruit"] },
  { word: "solitude", tags: ["emotion", "seul", "silence", "calme"] },
  { word: "amitié", tags: ["emotion", "lien", "confiance", "joie"] },
  { word: "promesse", tags: ["langage", "lien", "avenir", "parole"] },
  { word: "mensonge", tags: ["langage", "secret", "faux", "parole"] },
  { word: "verite", tags: ["langage", "vrai", "lumiere", "justice"] },
  { word: "justice", tags: ["societe", "loi", "équilibre", "verite"] },
  { word: "liberte", tags: ["societe", "droit", "ouvrir", "vol"] },
  { word: "prison", tags: ["lieu", "fermer", "loi", "ombre"] },
  { word: "cle", tags: ["objet", "ouvrir", "porte", "secret"] },
  { word: "coffre", tags: ["objet", "secret", "or", "fermer"] },
  { word: "tresor", tags: ["valeur", "or", "secret", "chasse"] },
  { word: "carte", tags: ["objet", "tresor", "voyage", "indice"] },
  { word: "indice", tags: ["mystere", "piste", "enquête", "secret"] },
  { word: "enquête", tags: ["mystere", "police", "indice", "verite"] },
  { word: "police", tags: ["societe", "loi", "enquête", "ville"] },
  { word: "voleur", tags: ["crime", "secret", "nuit", "argent"] },
  { word: "héros", tags: ["recit", "courage", "sauver", "légende"] },
  { word: "légende", tags: ["recit", "histoire", "mythe", "héros"] },
  { word: "mythe", tags: ["recit", "dieu", "légende", "ancien"] },
  { word: "dieu", tags: ["religion", "mythe", "pouvoir", "ciel"] },
  { word: "ange", tags: ["religion", "ciel", "aile", "lumiere"] },
  { word: "demon", tags: ["religion", "ombre", "peur", "feu"] },
  { word: "magie", tags: ["mystere", "pouvoir", "sort", "rêve"] },
  { word: "sort", tags: ["magie", "mot", "pouvoir", "mystere"] },
  { word: "potion", tags: ["magie", "boire", "chimie", "effet"] },
  { word: "cristal", tags: ["minéral", "lumiere", "verre", "magie"] },
  { word: "or", tags: ["minéral", "valeur", "jaune", "tresor"] },
  { word: "argent", tags: ["minéral", "valeur", "metal", "blanc"] },
  { word: "fer", tags: ["minéral", "metal", "force", "outil"] },
  { word: "outil", tags: ["objet", "travail", "main", "metal"] },
  { word: "marteau", tags: ["outil", "frapper", "fer", "travail"] },
  { word: "aiguille", tags: ["outil", "couture", "fin", "metal"] },
  { word: "fil", tags: ["tissu", "lien", "couture", "ligne"] },
  { word: "tissu", tags: ["materiau", "vetement", "doux", "fil"] },
  { word: "robe", tags: ["vetement", "tissu", "élégance", "soir"] },
  { word: "chaussure", tags: ["vetement", "pied", "marche", "cuir"] },
  { word: "chapeau", tags: ["vetement", "tete", "soleil", "style"] },
  { word: "masque", tags: ["objet", "visage", "cacher", "theatre"] },
  { word: "costume", tags: ["vetement", "theatre", "role", "soir"] },
];

// Dedupe by word (last wins), normalize
const byWord = new Map<string, LexEntry>();
for (const e of CEMANTIK_LEXICON) {
  const w = normalizeWord(e.word);
  if (!w) continue;
  byWord.set(w, { word: w, tags: [...new Set(e.tags.map((t) => normalizeWord(t)).filter(Boolean))] });
}

export const CEMANTIK_WORDS = [...byWord.keys()].sort((a, b) => a.localeCompare(b, "fr"));

export function normalizeWord(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "");
}

export function getEntry(word: string): LexEntry | undefined {
  return byWord.get(normalizeWord(word));
}

export function isKnownWord(word: string): boolean {
  return byWord.has(normalizeWord(word));
}

/** Cibles concrètes — plus accessibles (Facile). */
const EASY_TARGETS = [
  "arbre", "chat", "chien", "maison", "soleil", "mer", "pain", "livre",
  "eau", "feu", "lune", "fleur", "table", "porte", "voiture", "oiseau",
  "pomme", "neige", "plage", "train", "cafe", "lit", "rue", "ville",
];

/** Cibles abstraites / denses — Dur & Mystère. */
const HARD_TARGETS = [
  "silence", "destin", "memoire", "hasard", "liberte", "verite", "ombre",
  "echo", "horizon", "solitude", "courage", "promesse", "indice", "mythe",
  "magie", "espace", "temps", "rythme", "legende", "secret", "idee", "reve",
];

/** Pool ultra-serré pour le défi Mondial. */
const WORLD_TARGETS = [
  "silence", "destin", "echo", "ombre", "hasard", "indice", "mythe",
  "horizon", "crepuscule", "aurore", "solitude", "promesse", "memoire",
];

export type TargetPool = "easy" | "hard" | "world" | "all";

export function pickTarget(seed: number, pool: TargetPool = "all"): string {
  const from = (words: string[]) => {
    const list = words.map(normalizeWord).filter((w) => byWord.has(w));
    if (!list.length) return CEMANTIK_WORDS.filter((w) => w.length >= 4);
    return list;
  };
  let list: string[];
  switch (pool) {
    case "easy":
      list = from(EASY_TARGETS);
      break;
    case "hard":
      list = from(HARD_TARGETS);
      break;
    case "world":
      list = from(WORLD_TARGETS);
      break;
    default:
      list = CEMANTIK_WORDS.filter((w) => w.length >= 4);
  }
  const i = Math.abs(seed) % list.length;
  return list[i] ?? "secret";
}
