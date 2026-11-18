# Systèmes d'information — site du module

Site statique du module **Systèmes d'information** — 2ᵉ année Licence Informatique (S3), Département d'informatique,
Centre universitaire Nour Bachir – El Bayadh, année universitaire 2026/2027.

- Adresse publique : **https://migueraoui.github.io/SysInfo/**
- Construit avec [Astro](https://astro.build) (site statique, sans base de données, sans suivi ni cookies).
- Hébergé gratuitement sur GitHub Pages ; chaque `git push` sur `main` met le site à jour en 1 à 2 minutes.

---

## 1. Installation (une seule fois)

Prérequis : **Node.js 22.12 ou plus récent** (`node -v`) et **Git**.

```bash
npm install
```

### Fichiers privés

Le dossier `private/` n'est **jamais** envoyé sur GitHub (il est dans `.gitignore`). Il contient l'archive
et sa version extraite :

```
private/
  SI_Programme_complet.zip
  source/SI_Programme/
    Seance_01/ … Seance_05/
      Fiche_SI_0N.pdf        → fiche enseignant : PRIVÉE, jamais publiée
      Cours_SI_0N.pdf        → cours (public après publication)
      TD_SI_0N.pdf           → TD (public après publication)
      Corrige_TD_SI_0N.pdf   → corrigé : PRIVÉ par défaut
    Sources_LaTeX/           → sources : PRIVÉES, jamais publiées
```

Sur un nouvel ordinateur, recopiez l'archive dans `private/` puis extrayez-la (PowerShell) :

```powershell
Expand-Archive -Path private\SI_Programme_complet.zip -DestinationPath private\source -Force
```

> ⚠️ Le dépôt GitHub est **public** : tout fichier commité est visible par tous. Ne déplacez jamais un fichier
> de `private/` à la main ; utilisez toujours `npm run publish`.

---

## 2. Publier un document (un commit = un document)

```bash
npm run publish -- <séance> <cours|td|corrige> [chemin-du-pdf]
```

Sans chemin, le PDF est pris dans `private/source/SI_Programme/Seance_NN/`.
Le script :

1. copie (sans le déplacer) le PDF vers `public/docs/seance-NN/<type>-NN.pdf` ;
2. ajoute ou met à jour l'entrée dans `src/content/seances/NN.json` avec la date du jour (heure d'Alger) ;
3. vérifie tout le contenu (et annule ses modifications en cas d'erreur) ;
4. affiche les commandes Git à lancer.

### Exemples à copier-coller

Publier le TD de la séance 2 :

```bash
npm run publish -- 2 td
git add -A && git commit -m "content(seance-02): publier TD2"
git push
```

Publier le cours de la séance 3 :

```bash
npm run publish -- 3 cours
git add -A && git commit -m "content(seance-03): publier Cours 3"
git push
```

> **Windows PowerShell 5** ne reconnaît pas `&&`. Lancez alors les commandes une par une :
>
> ```powershell
> git add -A
> git commit -m "content(seance-02): publier TD2"
> git push
> ```

Remplacer un document déjà publié (version corrigée du PDF) :

```bash
npm run publish -- 2 td D:\Documents\TD_SI_02_v2.pdf --force
```

Choisir la date affichée (par défaut : aujourd'hui) :

```bash
npm run publish -- 2 td --date 2026-11-22
```

### Publier un corrigé (facultatif)

Les corrigés sont privés par défaut. Pour en publier un, il faut confirmer avec `--yes` :

```bash
npm run publish -- 2 corrige --yes
```

> ⚠️ Un corrigé publié devient **public** et reste dans l'historique Git, même si vous le retirez ensuite.

### Ajouter une nouvelle séance (ex. chapitre 3)

```bash
npm run new-seance -- 6 3 "Saisie et contrôle de l'information"
```

Cela crée `src/content/seances/06.json` sans document : la séance s'affiche **« À venir »**.
Complétez si besoin `resume` et `motsCles` dans ce fichier, et ajoutez le numéro `6` dans le tableau
`seances` du point concerné dans `src/content/chapitres.json` (page Programme). Ensuite :

```bash
git add -A && git commit -m "content(seance-06): ajouter la séance 6"
git push
npm run publish -- 6 cours D:\chemin\Cours_SI_06.pdf
```

### Publier une annonce

Créez un fichier Markdown dans `src/content/annonces/`, par exemple `src/content/annonces/2026-11-20-td-reporte.md` :

```markdown
---
titre: "Le TD de jeudi est reporté"
date: "2026-11-20"
---
Le TD de jeudi est reporté. La nouvelle date sera communiquée en séance.
```

Les trois annonces les plus récentes s'affichent sur la page d'accueil. Pour retirer une annonce, supprimez
le fichier. Puis :

```bash
git add -A && git commit -m "content(annonces): TD reporté"
git push
```

### Retirer un document

Supprimez le PDF dans `public/docs/seance-NN/` **et** son entrée dans `documents` du fichier
`src/content/seances/NN.json`, puis commitez. (Le fichier reste dans l'historique Git.)

---

## 3. Vérifier en local

```bash
npm run dev            # site de développement : http://localhost:4321/SysInfo/
npm run check          # contenu + types (doit afficher 0 erreur, 0 avertissement)
npm run build          # construit le site dans dist/
npm run preview        # sert dist/ : http://localhost:4321/SysInfo/
npm run linkcheck      # vérifie tous les liens et PDF de dist/ (après build)
npm run audit:private  # vérifie qu'aucun fichier privé n'est dans dist/ ni dans Git
```

Le build **échoue** si une séance référence un PDF absent, si un PDF de `public/docs/` n'est référencé par
aucune séance, ou si un fichier privé (fiche, source LaTeX…) se trouve dans `public/`.

---

## 4. Mise en ligne sur GitHub Pages

### Première mise en ligne (une seule fois)

1. Créez le dépôt **public** `SysInfo` sur GitHub (compte `migueraoui`), **sans** README ni `.gitignore`.
2. Envoyez le code :

   ```bash
   git remote add origin https://github.com/migueraoui/SysInfo.git
   git push -u origin main
   ```

3. Sur GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
4. Onglet **Actions** : attendez la fin du workflow « Déployer sur GitHub Pages » (coche verte).
   Le site est alors disponible sur https://migueraoui.github.io/SysInfo/.

Ensuite, chaque `git push` sur `main` redéploie automatiquement le site. Le workflow peut aussi être lancé à la
main : **Actions → Déployer sur GitHub Pages → Run workflow**.

### Changer de dépôt ou de compte

Modifiez seulement `GITHUB_USER` et `REPO` dans `src/site.config.ts`. Pour un dépôt nommé
`<utilisateur>.github.io`, le site est servi à la racine. Attention : l'adresse respecte la casse (`SysInfo`).

---

## 5. Organisation du projet

```
src/
  site.config.ts            adresse du site + informations du module
  content/
    seances/NN.json         une séance par fichier (titre, résumé, mots-clés, documents)
    chapitres.json          chapitres du canevas et séances correspondantes
    annonces/*.md           annonces (facultatives)
  content.config.ts         schémas de validation (zod)
  data/programme.ts         objectifs et bibliographie du canevas
  pages/                    accueil, séances, cours, TD, programme, 404
  components/               composants d'interface
  styles/global.css         couleurs, thème clair/sombre, styles de base
public/
  docs/seance-NN/*.pdf      PDF publiés (copiés par npm run publish)
scripts/                    publication, validation, vérification des liens
private/                    fichiers privés (jamais commités)
```

Format d'une séance (`src/content/seances/01.json`) :

```json
{
  "numero": 1,
  "chapitre": 1,
  "titre": "Définitions et caractérisations de l'entreprise",
  "resume": "…",
  "motsCles": ["organisation", "entreprise", "environnement"],
  "documents": [
    { "type": "cours", "fichier": "seance-01/cours-01.pdf", "date": "2026-11-14" },
    { "type": "td", "fichier": "seance-01/td-01.pdf", "date": "2026-11-14" }
  ]
}
```

`type` vaut `cours`, `td` ou `corrige` (libellés affichés : « Cours 1 », « TD1 », « Corrigé TD1 »).
Une séance dont `documents` est vide s'affiche « À venir ».

Les icônes et l'image de partage (`public/og.png`) sont générées par `node scripts/generate-icons.mjs`
(à relancer seulement si l'identité visuelle change).
