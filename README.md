# Suivi muscu — Léopold

App installable (PWA) qui accompagne le programme pecs & bras de 12 semaines (23/11/2026 → 14/02/2027) :

- **Aujourd'hui** : la séance prévue ce jour-là, le chrono de séance, les minuteurs de repos et de gainage, la vidéo de chaque exercice, la saisie des répétitions, les pas et les km du jour (pas reçus tout seuls depuis l'app Santé), le **traceur GPS** pour le vélo et la marche (carte, km, durée, vitesse, tracé).
- **Semaine** : le planning, modifiable pour une semaine ou pour toutes, et le bilan du dimanche.
- **Séances** : les 4 séances (A, B, C, Gainage) avec leurs vidéos.
- **Progrès** : objectifs, courbes, tests, bilans Biody, km par semaine et historique des sorties GPS.
- **Plus** : connexion au dépôt de données, notifications, raccourci Santé, nutrition et règles.

## Installer sur l'iPhone

1. Ouvre **https://ple07.github.io/suivi-muscu/** dans Safari.
2. Bouton Partager → **Sur l'écran d'accueil**.
3. Ouvre l'app depuis son icône, onglet **Plus** : colle ton token GitHub, puis **Activer les notifications**.

## Où sont les données

Sur le téléphone, et en copie dans le dépôt **privé** `PLe07/suivi-muscu-data` (fichier `data/suivi.json`). Ce dépôt envoie aussi les notifications (GitHub Actions) et reçoit les pas du raccourci iOS.

## Vidéos

Voir [VIDEOS.md](VIDEOS.md) : un prompt Gemini par exercice et le nom de fichier à utiliser.

## Carte

Le traceur utilise [Leaflet](https://leafletjs.com) (copie dans `vendor/`, licence BSD-2) et les fonds de carte © OpenStreetMap.
