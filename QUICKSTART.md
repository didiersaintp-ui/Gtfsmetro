# 🚀 Guide de Démarrage Rapide

Ce guide vous aidera à lancer l'application GTFS Metro Map Visualizer en quelques minutes avec Docker Desktop.

## Prérequis

- **Docker Desktop** installé et en cours d'exécution
- Un fichier **GTFS .zip** à tester (optionnel pour la démo)

## Démarrage avec Docker (Recommandé)

### Étape 1 : Cloner le Repository

```bash
git clone <repository-url>
cd Gtfsmetro
```

### Étape 2 : Lancer l'Application

```bash
docker-compose up --build
```

Cette commande va :
- 📦 Construire l'image Docker
- 📥 Installer toutes les dépendances
- ⚙️ Compiler l'application Next.js
- 🚀 Démarrer le serveur sur le port 3005

**Temps de build initial** : ~3-5 minutes (selon votre machine)

### Étape 3 : Accéder à l'Application

Une fois le build terminé, ouvrez votre navigateur :

```
http://localhost:3005
```

Vous verrez la page d'accueil avec le drag-and-drop pour uploader votre fichier GTFS.

### Étape 4 : Tester avec un Fichier GTFS

1. **Téléchargez un fichier GTFS de test** :
   - Paris : [IDFM GTFS](https://data.iledefrance-mobilites.fr/explore/dataset/offre-horaires-tc-gtfs-idfm/)
   - San Francisco : [SFMTA GTFS](https://www.sfmta.com/getting-around/muni/routes-stops/gtfs-api)
   - Ou tout autre réseau depuis [Transitland](https://www.transit.land/)

2. **Glissez-déposez** le fichier .zip sur la zone d'upload

3. **Attendez** le parsing (10-60 secondes selon la taille)

4. **Explorez** :
   - **Vue Réaliste** : Carte géographique avec Leaflet + OpenStreetMap
   - **Vue Métro-Style** : Diagramme schématique octilinéaire

## Commandes Docker Utiles

### Voir les logs en temps réel
```bash
docker-compose logs -f
```

### Arrêter l'application
```bash
docker-compose down
```

### Redémarrer après modification
```bash
docker-compose up --build
```

### Nettoyer complètement
```bash
docker-compose down -v
docker system prune -a
```

## Mode Développement Local (Sans Docker)

Si vous préférez développer localement :

### 1. Installer les Dépendances

```bash
npm install
```

### 2. Lancer le Serveur de Développement

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

### 3. Build de Production

```bash
npm run build
npm start
```

## Structure des Données GTFS Requises

Votre fichier GTFS .zip doit contenir au minimum :

- ✅ `routes.txt` - Liste des lignes
- ✅ `stops.txt` - Liste des stations
- ✅ `trips.txt` - Liste des trajets
- ✅ `stop_times.txt` - Horaires des arrêts
- ✅ `shapes.txt` - Tracés géographiques (optionnel mais recommandé)

## Fonctionnalités Principales

### 📤 Upload
- Drag-and-drop de fichiers GTFS .zip
- Validation automatique
- Limite : 100 MB

### 🗺️ Vue Réaliste
- Carte interactive avec Leaflet.js
- Fond OpenStreetMap
- Zoom/Pan
- Popups d'information

### 🚇 Vue Métro-Style
- Algorithmes de schématisation avancés
- Angles octilinéaires (0°, 45°, 90°, 135°)
- Optimisation force-directed
- Légende interactive

### 📊 Statistiques
- Nombre de routes par type
- Nombre de stations
- Stations d'interchange
- Terminaux

## Ports Utilisés

- **Application** : `3005`
- **API Upload** : `/api/upload`
- **API Parse** : `/api/parse`
- **API Render** : `/api/render`

## Volumes Docker

- `./public/uploads` : Fichiers GTFS uploadés
- `gtfs-data` : Bases de données SQLite

## Performance

### Temps de Traitement Typiques

| Taille du Réseau | Routes | Stops | Temps |
|------------------|--------|-------|-------|
| Petit | < 20 | < 100 | ~5-10s |
| Moyen | 20-100 | 100-500 | ~15-30s |
| Grand | 100+ | 500+ | ~30-60s |

### Optimisations

- SQLite avec index pour requêtes rapides
- Cache en mémoire des données parsées
- Algorithmes optimisés
- Canvas rendering pour grands datasets

## Dépannage

### Port 3005 déjà utilisé

Modifiez le port dans `docker-compose.yml` :

```yaml
ports:
  - "3006:3005"  # Utiliser 3006 au lieu de 3005
```

### Erreur "Failed to parse GTFS data"

- Vérifiez que votre GTFS est valide avec [GTFS Validator](https://gtfs-validator.mobilitydata.org/)
- Assurez-vous que les fichiers requis sont présents

### Mémoire insuffisante

Augmentez la mémoire allouée à Docker Desktop :
- Docker Desktop → Settings → Resources → Memory : 4-8 GB

### Build Docker échoue

```bash
# Nettoyer le cache Docker
docker system prune -a

# Rebuild
docker-compose up --build
```

## Support

- 📚 Documentation complète : [README.md](./README.md)
- 🐛 Issues : GitHub Issues
- 📖 Spécification GTFS : [gtfs.org](https://gtfs.org/)

## Prochaines Étapes

Après avoir testé l'application :

1. **Personnalisez** les couleurs dans `lib/gtfs/parser.ts`
2. **Ajustez** les paramètres d'algorithmes dans `lib/layout/metro-layout.ts`
3. **Explorez** le code dans les dossiers `lib/` et `components/`
4. **Contribuez** en créant une Pull Request !

---

**Bon développement ! 🚇✨**

Pour toute question, consultez le [README.md](./README.md) complet.
