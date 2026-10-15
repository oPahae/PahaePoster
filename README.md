# PahaePoster

Application desktop web centralisant cinq outils developpeur : Databaser, API Poster, SSHer, Classer et Sharer.

L'application demarre via un petit serveur Node personnalise (`server.js`) qui enveloppe Next.js pour ajouter le support WebSocket necessaire au module Sharer. Les commandes `npm install` et `npm run dev` restent inchangees.

## Installation

```bash
npm install
```

## Configuration

Copie le fichier d'exemple puis ajuste les valeurs :

```bash
cp .env.example .env
```

Variables disponibles :

- `ENCRYPTION_KEY` : cle utilisee pour chiffrer les mots de passe stockes (bases de donnees et serveurs SSH). Utilise une valeur longue et aleatoire en production.
- `DATABASE_PATH` : chemin du fichier SQLite interne (par defaut `./data/pahaeposter.sqlite`).

## Lancement

```bash
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

## Architecture

```
pages/            Routes Next.js (Pages Router)
  index.js        Tableau de bord
  databaser.js     Module Databaser
  poster.js         Module API Poster
  ssher.js          Module SSHer
  classer.js        Module Classer (diagramme de classes UML)
  sharer/           Module Sharer (partage local reseau), index.js et [session].js
  api/              Routes API (base de donnees interne, connexions SQL, SSH, IA, Sharer)

components/
  layout/           Sidebar, notifications, confirmations, loaders, theme, editeur de code
  database/         Connexions, exploration SQL, editeur SQL, MPD
  poster/           Constructeur de requetes HTTP
  ssher/            Serveurs, terminal, explorateur de fichiers, editeur
  classer/          Canvas de classes, editeur de lignes rapide, relations, generation IA
  sharer/           Vue de session, onglet medias, onglet presse-papiers, hook WebSocket

lib/
  db.js             Base SQLite interne (tables connections, servers, settings)
  crypto.js         Chiffrement des mots de passe (AES-256-GCM)
  sqlHelpers.js     Connexion et requetes MySQL / PostgreSQL
  sshSessions.js    Sessions SSH interactives en memoire
  classHeuristics.js    Suggestions d'attributs par nom de classe
  classDiagramSyntax.js Syntaxe et parseur pour la generation IA du diagramme
  classDiagramExport.js Export PNG du diagramme (SVG + canvas, couleurs du theme)
  sqlDiagramImport.js   Parseur SQL (CREATE TABLE) vers classes et relations
  classDiagramLayout.js Geometrie des boites et algorithme d'auto-organisation
  sharerStore.js    Stockage disque des sessions Sharer (fichiers, presse-papiers)
  sharerRealtime.js Diffusion WebSocket partagee avec server.js
  localNetwork.js   Detection de l'adresse IPv4 locale
  utils.js          Fonctions utilitaires partagees

server.js           Serveur HTTP personnalise (Next.js + WebSocket pour Sharer)
```

## Utilisation

### Databaser

1. Cree une nouvelle connexion MySQL ou PostgreSQL.
2. Teste puis enregistre la connexion.
3. Connecte-toi pour explorer les tables, consulter les colonnes et parcourir les donnees avec pagination et recherche.
4. Ajoute, modifie ou supprime des lignes directement depuis le tableau.
5. Utilise l'onglet SQL pour ecrire et executer des requetes avec autocompletion.
6. Clique sur "Voir MPD" pour generer le modele physique de donnees : les tables peuvent etre glissees librement pour reorganiser le schema, puis exporte en PNG ou PDF.

### API Poster

1. Choisis la methode HTTP et saisis l'URL.
2. Ajoute des headers et un body JSON (formatage et validation automatiques).
3. Envoie la requete et inspecte la reponse, les headers et la structure JSON deduite.

### SSHer

1. Enregistre un serveur (IP, utilisateur, mot de passe) puis teste la connexion.
2. Ouvre un terminal interactif complet (xterm.js) pour executer des commandes Linux.
3. Utilise l'explorateur de fichiers graphique pour naviguer, creer, renommer, modifier et supprimer fichiers et dossiers.
4. Ouvre un fichier dans l'editeur graphique pour le modifier sans passer par un terminal nano.

### Classer

1. Tape un nom de classe (ex: "utilisateur", "produit", "commande") puis Entree : des attributs courants sont generes automatiquement selon le nom.
2. Dans une classe, ecris `-nom` pour un attribut prive ou `+nom` pour un public, Tab pour passer au type (avec autocompletion), Entree pour valider et enchainer sur la ligne suivante. Les fleches Haut/Bas naviguent entre les lignes, Retour arriere sur une ligne vide la supprime.
3. Un attribut prive (`-`) genere automatiquement un getter public (`+`) dans le bloc des methodes.
4. Glisse une classe par son en-tete pour la deplacer. Utilise l'icone de lien sur l'en-tete pour la relier a une autre classe : un popup permet de choisir le type de relation (association, agregation, composition, heritage, realisation, dependance) et les cardinalites.
5. Le bouton "Organiser" repositionne automatiquement les classes pour eviter les chevauchements.
6. Le bouton "Generer avec l'IA" envoie une description du projet a une API externe et construit le diagramme a partir de sa reponse.
7. Le bouton "Importer du SQL" transforme des instructions `CREATE TABLE` collees (MySQL/PostgreSQL) en classes : cles primaires publiques, autres colonnes privees avec getter automatique, `FOREIGN KEY` converties en relations d'association. Entierement local, aucun appel reseau.
8. Les boutons de zoom (loupe +/-) agrandissent ou reduisent le canevas ; cliquer sur le pourcentage revient a 100%.
9. Le bouton "Telecharger" exporte le diagramme actuel en PNG, avec les couleurs du theme actif.
10. Le bouton "Vider" supprime toutes les classes et relations apres confirmation.

### Sharer

1. Ouvre l'onglet Sharer : une session est creee automatiquement (code aleatoire de 8 caracteres, ex: A7K92MQL).
2. L'adresse locale affichee (`http://<IP-du-PC>:3000/sharer/<code>`) et le QR code permettent a un telephone ou une tablette du meme reseau d'ouvrir la meme interface dans son navigateur, sans application.
3. Onglet Medias : glisse-depose ou choisis des fichiers, suis la progression de l'envoi, telecharge, copie le lien ou supprime un fichier.
4. Onglet Presse-papiers : ajoute du texte, visible immediatement sur tous les appareils connectes, copie ou supprime un element.
5. Toute mise a jour (fichier ajoute, texte partage) apparait instantanement chez tous les appareils via WebSocket, sans recharger la page.
6. Le bouton "Nouvelle session" detruit definitivement la session courante (fichiers et presse-papiers) et en cree une nouvelle.
7. Un code de session inconnu renvoie une vraie page 404.
8. Si l'adresse detectee automatiquement ne correspond pas au bon reseau (VPN, WSL, machine virtuelle...), le lien "Changer d'adresse detectee" permet de choisir manuellement la bonne IP parmi celles detectees ; ce choix est memorise.

## Securite

- Les mots de passe des connexions SQL et des serveurs SSH sont chiffres avant stockage (AES-256-GCM) et ne sont jamais renvoyes en clair par l'API.
- La cle de chiffrement provient exclusivement de la variable d'environnement `ENCRYPTION_KEY`.

## Application desktop (Electron)

Prerequis : Node.js 18+ (LTS recommande). Sous Windows, la compilation du module natif `better-sqlite3` utilise un binaire precompile ; si npm tente de compiler depuis les sources, installer les "Outils de build Visual Studio" (charge de travail C++).

```bash
npm install
npm run electron:start   # lance l'app desktop (rebuild natif + build Next + Electron)
npm run dist             # genere l'installateur Windows dans release/
npm run pack             # (optionnel) dossier non installe dans release/win-unpacked
```

- `npm run electron:start` / `dist` recompilent `better-sqlite3` pour Electron. Pour revenir a `npm run dev` / `npm start` dans le navigateur, lancer ensuite `npm run rebuild:node`.
- Donnees (SQLite, sessions Sharer, cle de chiffrement `secret.key`, logs) : `%APPDATA%\PahaePoster`.
- Port fixe `5555` (modifiable via la variable d'environnement `PAHAE_PORT`). Il doit etre libre : ne pas lancer `npm run dev` en meme temps.
- Pour reutiliser une base existante : copier `pahaeposter.sqlite*` dans `%APPDATA%\PahaePoster\data` et ecrire l'ancienne valeur de `ENCRYPTION_KEY` (du `.env`) dans `%APPDATA%\PahaePoster\secret.key` (sans retour a la ligne superflu).
