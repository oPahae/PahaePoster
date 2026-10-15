function normalize(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/s$/, "");
}

const PRESETS = {
  user: ["id:int", "-nom:string", "-prenom:string", "-email:string", "-telephone:string", "-motDePasse:string"],
  utilisateur: ["id:int", "-nom:string", "-prenom:string", "-email:string", "-telephone:string", "-motDePasse:string"],
  client: ["id:int", "-nom:string", "-prenom:string", "-email:string", "-telephone:string"],
  customer: ["id:int", "-nom:string", "-prenom:string", "-email:string", "-telephone:string"],
  admin: ["id:int", "-nom:string", "-email:string", "-motDePasse:string", "-role:string"],
  employe: ["id:int", "-nom:string", "-prenom:string", "-poste:string", "-salaire:double"],
  employee: ["id:int", "-nom:string", "-prenom:string", "-poste:string", "-salaire:double"],
  product: ["id:int", "-nom:string", "-description:string", "-prix:double", "-stock:int"],
  produit: ["id:int", "-nom:string", "-description:string", "-prix:double", "-stock:int"],
  order: ["id:int", "-dateCommande:date", "-statut:string", "-total:double"],
  commande: ["id:int", "-dateCommande:date", "-statut:string", "-total:double"],
  category: ["id:int", "-nom:string", "-description:string"],
  categorie: ["id:int", "-nom:string", "-description:string"],
  comment: ["id:int", "-contenu:string", "-dateCreation:date"],
  commentaire: ["id:int", "-contenu:string", "-dateCreation:date"],
  payment: ["id:int", "-montant:double", "-datePaiement:date", "-methode:string"],
  paiement: ["id:int", "-montant:double", "-datePaiement:date", "-methode:string"],
  address: ["id:int", "-rue:string", "-ville:string", "-codePostal:string", "-pays:string"],
  adresse: ["id:int", "-rue:string", "-ville:string", "-codePostal:string", "-pays:string"],
  invoice: ["id:int", "-numero:string", "-dateEmission:date", "-montant:double"],
  facture: ["id:int", "-numero:string", "-dateEmission:date", "-montant:double"],
  book: ["id:int", "-titre:string", "-auteur:string", "-isbn:string", "-prix:double"],
  livre: ["id:int", "-titre:string", "-auteur:string", "-isbn:string", "-prix:double"],
  car: ["id:int", "-marque:string", "-modele:string", "-immatriculation:string"],
  voiture: ["id:int", "-marque:string", "-modele:string", "-immatriculation:string"],
  vehicule: ["id:int", "-marque:string", "-modele:string", "-immatriculation:string"],
  vehicle: ["id:int", "-marque:string", "-modele:string", "-immatriculation:string"],
  message: ["id:int", "-contenu:string", "-dateEnvoi:date"],
  reservation: ["id:int", "-dateDebut:date", "-dateFin:date", "-statut:string"],
  ticket: ["id:int", "-titre:string", "-description:string", "-statut:string", "-priorite:string"],
  teacher: ["id:int", "-nom:string", "-prenom:string", "-matiere:string", "-email:string"],
  professeur: ["id:int", "-nom:string", "-prenom:string", "-matiere:string", "-email:string"],
  enseignant: ["id:int", "-nom:string", "-prenom:string", "-matiere:string", "-email:string"],
  student: ["id:int", "-nom:string", "-prenom:string", "-email:string", "-dateNaissance:date"],
  etudiant: ["id:int", "-nom:string", "-prenom:string", "-email:string", "-dateNaissance:date"],
  eleve: ["id:int", "-nom:string", "-prenom:string", "-email:string", "-dateNaissance:date"],
  school: ["id:int", "-nom:string", "-adresse:string"],
  ecole: ["id:int", "-nom:string", "-adresse:string"],
  company: ["id:int", "-nom:string", "-adresse:string", "-siret:string"],
  entreprise: ["id:int", "-nom:string", "-adresse:string", "-siret:string"],
  societe: ["id:int", "-nom:string", "-adresse:string", "-siret:string"],
  article: ["id:int", "-titre:string", "-contenu:string", "-dateCreation:date"],
  role: ["id:int", "-nom:string", "-description:string"],
  notification: ["id:int", "-message:string", "-dateEnvoi:date", "-lu:boolean"],
  panier: ["id:int", "-dateCreation:date", "-total:double"],
  cart: ["id:int", "-dateCreation:date", "-total:double"],
  livraison: ["id:int", "-adresse:string", "-dateLivraison:date", "-statut:string"],
  delivery: ["id:int", "-adresse:string", "-dateLivraison:date", "-statut:string"],
  avis: ["id:int", "-note:int", "-commentaire:string", "-dateCreation:date"],
  review: ["id:int", "-note:int", "-commentaire:string", "-dateCreation:date"]
};

const DEFAULT_PRESET = ["id:int", "-nom:string", "-description:string"];

export function guessAttributes(className) {
  const key = normalize(className);
  const preset = PRESETS[key] || DEFAULT_PRESET;
  return preset.map((entry) => {
    const visibility = ["+", "-", "#", "~"].includes(entry[0]) ? entry[0] : "+";
    const rest = ["+", "-", "#", "~"].includes(entry[0]) ? entry.slice(1) : entry;
    const [name, type] = rest.split(":");
    return { visibility, name, type: type || "string" };
  });
}

export const COMMON_ATTRIBUTE_NAMES = [
  "id", "nom", "prenom", "email", "telephone", "motDePasse", "adresse", "ville", "codePostal", "pays",
  "prix", "description", "stock", "quantite", "dateCreation", "dateModification", "dateDebut", "dateFin",
  "statut", "total", "montant", "numero", "titre", "contenu", "note", "actif", "photo", "image", "url",
  "slug", "poste", "salaire", "role", "type", "categorie", "reference", "code", "commentaire"
];

export const COMMON_TYPES = [
  "string", "int", "double", "float", "boolean", "date", "datetime", "long", "char", "text", "decimal", "void"
];
