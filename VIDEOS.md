# Vidéos des exercices (à générer avec Gemini)

L'app affiche la vidéo d'un exercice quand le fichier `videos/<nom>.mp4` existe dans ce dépôt.
Sinon, elle propose des démos YouTube à la place.

## Comment faire

**Une conversation Gemini par vidéo.** Si tu enchaînes plusieurs prompts dans la même conversation, Gemini recopie la vidéo précédente (on a eu des « pompes diamant » et des « archer » qui étaient en fait des pompes pieds surélevés ou des pike push-ups). Vérifie toujours la vidéo avant de l'ajouter.

1. Ouvre Gemini (compte Pro) et choisis la génération de vidéo.
2. Colle le **style commun**, puis la description de l'exercice.
3. Regarde la vidéo et vérifie la technique avec les consignes de l'app. Une IA peut se tromper (dos creux, coudes trop écartés…) : si c'est le cas, régénère.
4. Télécharge le MP4 et renomme-le exactement comme indiqué (par exemple `pompes-archer.mp4`).
5. Deux façons de l'ajouter :
   - sur github.com : dépôt `suivi-muscu` → dossier `videos` → **Add file → Upload files** ;
   - ou range les vidéos dans un dossier Google Drive « Vidéos muscu » et demande à Claude de les ajouter.

## Style commun (à mettre au début de chaque prompt)

> Realistic video, 16:9, about 8 seconds. A fit young man around 19 years old, short dark hair, plain grey t-shirt and black shorts. Static camera at hip height, side view, his whole body always in frame. He performs two slow, controlled repetitions with textbook technique. Bright natural light. No text, no logos, no music.

Lieu : « in a bright, tidy bedroom with a wooden floor and an exercise mat » pour les exercices en chambre, « in an outdoor street workout park in the morning » pour la séance B.

## Les 21 vidéos

| Fichier | Exercice | Description à coller après le style commun |
| --- | --- | --- |
| `pompes-pieds-sureleves.mp4` | Pompes pieds surélevés | In a bedroom. Decline push-ups: feet resting on the edge of a bed, hands on the floor slightly wider than shoulders, body in one rigid straight line from head to heels, elbows about 45 degrees from the torso, chest lowers to just above the floor, then pushes back up. |
| `pompes-deficit.mp4` | Pompes en déficit | In a bedroom. Deficit push-ups: each hand on a stack of thick books, the chest slowly descends below the level of the hands over three seconds, body perfectly straight, then pushes back up. |
| `dips-chaise.mp4` | Dips sur chaise | In a bedroom. Bench dips: back to a sturdy chair, hands on the front edge of the seat, legs straight with heels on the floor, lowers until the elbows reach 90 degrees, shoulders kept down away from the ears, then pushes up. |
| `pompes-diamant.mp4` | Pompes diamant | In a bedroom. Diamond push-ups: hands together under the chest, thumbs and index fingers forming a diamond, elbows close to the body, body straight, chest lowers to the hands, then pushes up. |
| `pike-push-up.mp4` | Pike push-ups | In a bedroom. Pike push-ups: hips high so the body forms an inverted V, the head lowers toward the floor between the hands, then pushes back up. |
| `pompes.mp4` | Pompes classiques | In a bedroom. Standard push-ups: hands under the shoulders, body straight from head to heels, chest almost touching the floor, full lockout at the top. |
| `tractions-pronation.mp4` | Tractions pronation | In an outdoor street workout park. Pull-ups on a high bar: overhand grip slightly wider than the shoulders, starts from a dead hang, pulls until the chin clears the bar, lowers slowly to full extension. |
| `dips-barres.mp4` | Dips aux barres parallèles | In an outdoor street workout park. Parallel bar dips: torso leaning slightly forward, lowers until the shoulders are just below the elbows, pushes back up to full lockout. |
| `chin-ups.mp4` | Chin-ups | In an outdoor street workout park. Chin-ups on a high bar: underhand grip at shoulder width, pulls until the chin is over the bar, slow controlled descent. |
| `rowing-australien.mp4` | Rowing australien | In an outdoor street workout park. Australian rows under a low bar at hip height: body straight under the bar, heels on the ground, pulls the chest up to touch the bar, lowers slowly. |
| `releves-genoux-suspendu.mp4` | Relevés de genoux suspendu | In an outdoor street workout park. Hanging knee raises from a pull-up bar: knees lift to chest height without swinging, then lower slowly. |
| `pompes-archer.mp4` | Pompes archer | In a bedroom. Archer push-ups: hands placed very wide, the body lowers toward one hand while the other arm stays straight out to the side, then the other side. |
| `pompes-lestees.mp4` | Pompes lestées | In a bedroom. Push-ups wearing a loaded backpack strapped tight on the back, body straight, full range of motion. |
| `rowing-table.mp4` | Rowing sous une table | In a bedroom. Inverted rows under a sturdy wooden table: lying on his back under the table, gripping its edge, body straight, pulls the chest up to the edge, then lowers slowly. |
| `curl-sac.mp4` | Curl biceps au sac à dos | In a bedroom. Standing biceps curls holding a loaded backpack by its straps with an underhand grip, elbows pinned to his sides, curls up, then lowers over two seconds. |
| `extensions-triceps.mp4` | Extensions triceps | In a bedroom. Bodyweight triceps extensions: hands on the edge of a sturdy desk, body straight and inclined, only the elbows bend so the forehead moves toward the hands, then the arms extend back. |
| `planche.mp4` | Planche | In a bedroom. Forearm plank on a mat: elbows under the shoulders, straight line from head to heels, glutes squeezed, holding perfectly still. |
| `gainage-lateral.mp4` | Gainage latéral | In a bedroom. Side plank on one forearm: hips lifted high, body in a straight line, holding still. |
| `hollow-hold.mp4` | Hollow hold | In a bedroom. Hollow body hold on a mat: lower back pressed into the floor, shoulders and straight legs lifted a few centimetres, arms extended overhead, holding still. |
| `releves-jambes.mp4` | Relevés de jambes allongé | In a bedroom. Lying leg raises on a mat: legs straight, raised to vertical, then lowered slowly without touching the floor. |
| `superman.mp4` | Superman | In a bedroom. Superman exercise lying face down on a mat: arms and legs lift together, hold two seconds at the top, then lower. |

La vidéo `planche.mp4` sert à la fois pour la séance C et la séance Gainage.
