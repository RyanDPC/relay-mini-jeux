# RELAY

Mini launcher web multi-jeux : compte **username + mot de passe**, amis, chat live, parties, scores. **Aucun email**.

## Fonctionnalités

- Auth username (Edge Function) + **rate-limit** + **code de récupération** (sans email)
- Hub solo : Pulse Snake, Echo Memory, Drift Breaker
- **Contrôles tactiles** (pad) sur mobile
- Amis (ajouter / accepter / retirer) + présence **en ligne** (Realtime)
- **Chat** temps réel entre amis
- **Party live** : room, invitation, duel de scores Pulse Snake
- Profil éditable (avatar, accent, nom affiché)

## Démarrage

```bash
cd relay
npm install
cp .env.example .env
npm run dev
```

## Supabase (projet Gaming)

Migrations dans `supabase/migrations/`. Edge Function : `username-auth` (signup / signin / recover).

Auth → email technique `username@players.relay.game` (jamais affiché).
