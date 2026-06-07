# Compte-rendu : Mises à Jour OverMind-MCP (v1.11.0 → v2.2.4)

*Rapport généré le 10 Mai 2026 — Analyse comparative avec la Roadmap & Architecture VPS cible.*

---

## 1. Ce qui a été réalisé (Synthèse des 80+ commits)

### v1.12.0-alpha → v1.13.15 : Résolution des Failles d'Audit

**Toutes les failles OOM et ASYNC identifiées lors de notre audit ont été corrigées.**

| ID Faille | Correction |
|-----------|-----------|
| OOM-1 | Cap stdout/stderr à **10 Mo** dans tous les runners (Claude, Kilo, Gemini) |
| OOM-2 | `run_agents_parallel` : annulation propre des promesses perdantes via **AbortController** |
| OOM-3 | `metadata` : paramètre `depth.max(8)` + skip des fichiers >1 Mo |
| OOM-4 | `OpenClawRunner` : SIGTERM → SIGKILL (5s) + nettoyage des listeners |
| ASYNC-1 | Détection déconnexion MCP via **AbortSignal** propagé au child process |
| ASYNC-2 | `KiloRunner` : fuite `killTimer` corrigée avant retry 401 |
| ASYNC-3 | `GeminiRunner` : helper `cleanup()` retire tous les listeners |
| ASYNC-4 | `sessions.ts` : race condition supprimée via **`async-mutex`** |

**SEC-3 (Shell Injection partielle)** : Le binaire Hermes est maintenant détecté de manière cross-platform (Windows/Linux/macOS) via `HERMES_BIN_PATH`, réduisant le risque.

---

### v2.0.0 : La Grande Mutation — Swarm & Observabilité

C'est la version-clé. Le code a fait un saut architectural majeur.

#### Nouveau Module : `src/lib/orchestration/dispatcher.ts`
Le cœur du nouveau système. Un **dispatcher intelligent** à 3 routes, activé par variables d'environnement :
1. `OVERMIND_WORKFLOW=temporal` → route vers Temporal
2. `OVERMIND_BROKER=rabbitmq` → route vers RabbitMQ
3. **Fallback automatique** sur l'exécution locale si les services sont indisponibles

#### Nouveau Module : `src/lib/orchestration/swarm.ts`
Le `SwarmOrchestrator` est implémenté :
- Allocation dynamique de tâches aux agents par capacités (`'code'`, `'analysis'`, `'scraping'`...)
- **Load Balancing** intelligent (score = 70% charge + 30% temps estimé)
- File de priorité des tâches (1-10)
- Statistiques temps réel (completed, failed, running, pending)

#### Nouveaux Workers Asynchrones
- `src/bin/rabbitmq-worker.ts` : Consommateur de messages RabbitMQ
- `src/bin/temporal-worker.ts` : Worker Temporal avec retry x2 et timeout 15 min
- `src/lib/workflow/temporal/workflows.ts` : Workflow `longRunningWorkflow` survivant aux crashes (jusqu'à 7 jours)

#### Observabilité : `src/lib/telemetry.ts`
OpenTelemetry est intégré de manière correcte :
- Activation via `OTEL_ENABLED=true`
- Export vers OpenTelemetry Collector via OTLP/HTTP
- **Mode no-op valide** quand désactivé (le bug du `TypeError: span.setAttribute is not a function` est corrigé)
- Spans sur tous les Runners et les outils clés

#### Infrastructure Docker
Un `docker-compose.yml` est inclus dans le projet avec les configs Prometheus et OTEL Collector. Il tourne 7 services : PostgreSQL, RabbitMQ, Redis, Prometheus, Grafana, Jaeger, OTEL Collector.

#### Qualité Runners (v1.13.13)
Tous les 8 runners (Claude, Kilo, Gemini, Hermes, Cline, OpenClaw, OpenCode, QwenCLI) ont atteint un score "10/10" avec une architecture uniformisée :
- Pino logger structuré
- Hard timeout SIGTERM → SIGKILL
- Nettoyage des fichiers temporaires

---

### v2.1.0 → v2.2.4 : Scripts d'Installation & PostgreSQL Simplifié

- Scripts d'installation one-click (`install-overmind-unix.sh`, `install-overmind-windows.bat`)
- `postinstall.mjs` : détecte PostgreSQL existant pour éviter les conflits de conteneurs
- Fix de sécurité critique dans le script de désinstallation (protection des containers utilisateur)
- Support de toutes les implémentations Docker (pas seulement Docker Desktop)

---

## 2. Comparaison avec Notre Roadmap

| Phase Roadmap | Objectif | Statut |
|--------------|---------|--------|
| **Phase 1 [v2.0.0]** — Sécurité SEC-1 (Auth M2M) | JWT / mTLS | 🔴 **NON FAIT** |
| **Phase 1 [v2.0.0]** — Sécurité SEC-2 (Path Traversal) | Validation Regex `name` | 🟡 **Partiel** (create_agent validé, delete/get non confirmés) |
| **Phase 1 [v2.0.0]** — Sécurité SEC-3 (Shell Injection) | `shell: false` | 🟡 **Partiel** (cross-platform, mais `shell: true` non confirmé supprimé) |
| **Phase 1 [v2.0.0]** — Sécurité SEC-4 (API Keys Leak) | Masquage dans get_agent_configs | 🔴 **NON FAIT** |
| **Phase 1 [v2.0.0]** — Redis Cache | Mémoire court terme | 🟡 **Redis présent** dans le Docker Compose mais non intégré dans les runners |
| **Phase 2 [v2.1.0]** — Message Broker RabbitMQ | Bus d'événements central | ✅ **FAIT** (rabbitmq.ts + worker + dispatcher) |
| **Phase 2 [v2.1.0]** — Refactoring run_agents_parallel | Asynchrone via Broker | ✅ **FAIT** (délègue au dispatcher, mode waitAll/race) |
| **Phase 3 [v2.2.0]** — Maker/Checker Pipeline | Workflow de validation | 🔴 **NON FAIT** |
| **Phase 3 [v2.2.0]** — ReAct Loops | Boucles de raisonnement | 🔴 **NON FAIT** |
| **Phase 4 [v2.3.0]** — Temporal | Orchestration Stateful | ✅ **FAIT** (workflows, activities, client, dispatch) |
| **Phase 4 [v2.3.0]** — Workflows Stateful | Multi-heures, survie aux crashes | ✅ **FAIT** (`longRunningWorkflow` jusqu'à 7 jours) |
| **Phase 5 [v2.4.0]** — Prometheus/Grafana | Métriques infra | ✅ **FAIT** (config + Docker Compose) |
| **Phase 5 [v2.4.0]** — Jaeger/OpenTelemetry | Traces distribuées | ✅ **FAIT** (`telemetry.ts` + OTEL Collector) |
| **Phase 5 [v2.4.0]** — Pont WebCV→Agents | Trace IDs Sentry↔Jaeger | 🔴 **NON FAIT** |

> [!IMPORTANT]
> **Observation clé** : Votre co-dev a sauté directement aux Phases 2, 4 et 5 sans terminer les correctifs critiques de la Phase 1 (Auth & Masquage des Secrets). Les failles SEC-1 et SEC-4 restent ouvertes sur la version actuelle.

---

## 3. Analyse Avantages / Inconvénients pour Votre Architecture VPS Cible

### ✅ Avantages Majeurs

**1. Le dispatcher avec fallback automatique est une excellente décision**
Il permet de démarrer sans Temporal ni RabbitMQ et de les activer progressivement via `.env`. Parfait pour votre VPS où vous contrôlez les services.

**2. OpenTelemetry est intégré proprement**
L'intégration via OTLP/HTTP est standard et se connectera directement à votre stack Jaeger/Prometheus dans `ai-agents-infra` via le pont réseau Docker que vous avez défini.

**3. Les corrections OOM sont critiques pour votre contrainte RAM**
Le cap à 10 Mo et l'AbortController sur les promesses parallèles permettent maintenant d'envisager des Swarms sur un conteneur limité à 1.5 Go sans risquer l'OOM Kill immédiat.

**4. Temporal pour les workflows OSINT long-courriers**
Le `longRunningWorkflow` avec durée jusqu'à 7 jours est exactement ce que vous ciblez pour les tâches de veille et d'analyse de repos.

**5. Architecture uniforme des 8 runners**
Tous les runners partagent maintenant la même base (Pino, OTEL, hard timeout). Votre Hermes peut maintenant être instrumenté de la même façon que Claude ou Kilo.

---

### ⚠️ Inconvénients et Risques Restants

**1. 🔴 CRITIQUE : Aucune Authentification (SEC-1) — Le risque P0 reste ouvert**
Le transport STDIO est toujours en place. Quand vous exposerez OverMind via votre réseau Docker (`hermes_net`), **n'importe quel container sur le même réseau peut appeler les 14 outils sans s'authentifier**. C'est un risque de compromission de toute votre infrastructure.

**2. 🔴 CRITIQUE : Les clés API sont toujours exposées par `get_agent_configs` (SEC-4)**
Le masquage des secrets n'a pas été implémenté. `get_agent_configs` retourne toujours `settings.json` en texte clair.

**3. ⚠️ Conflit de docker-compose.yml**
OverMind embarque maintenant son propre `docker-compose.yml` dans le dépôt source. **Il y a un conflit architectural** : vous avez votre propre `docker-compose.yml` dans `ai-agents-infra` avec une configuration Zero-Trust (read_only, cap_drop, limites RAM). Le fichier d'OverMind ignore toutes ces contraintes de sécurité. Si vous montez le source OverMind en volume en mode "Dev", ces deux fichiers coexisteront sans être alignés.

**4. ⚠️ Redis installé mais non intégré dans les Runners**
Redis est dans le Docker Compose mais aucun runner ne l'utilise encore pour la persistance du contexte conversationnel. La mémoire à court terme reste volatile.

**5. ⚠️ Temporal désactivé dans le Compose (v2.1.1)**
Le changelog de v2.1.1 mentionne explicitement : *"Disabled Temporal service (requires complex DB initialization)"*. Le code est là, mais le service Docker ne démarre pas par défaut. Vous devrez le réactiver et configurer sa base de données manuellement.

**6. ⚠️ Le SwarmOrchestrator est en mémoire**
Le `SwarmOrchestrator` (`swarm.ts`) gère son état (task queue, allocations, results) via des `Map` en mémoire Node.js. Si OverMind crashe, l'état du Swarm est perdu. C'est cohérent avec la v2, mais à surveiller avant de passer sur Temporal.

**7. ⚠️ Le docker-compose d'OverMind n'a pas de `read_only`, pas de `cap_drop`, pas de limites RAM**
Son PostgreSQL réserve `POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB` — incompatible avec votre limite de 1.5 Go par agent.

---

## 4. Actions Recommandées

### Priorité Immédiate (Blocantes Production)

1. **Corriger SEC-1 et SEC-4** : Ouvrir une Pull Request sur le dépôt OverMind avec le masquage des secrets dans `get_agent_configs` et l'ajout d'un middleware d'authentification Bearer Token sur le transport SSE.
2. **Aligner les deux `docker-compose.yml`** : La configuration de sécurité de `ai-agents-infra` doit prendre le dessus. Désactiver (ou supprimer via `.dockerignore`) le `docker-compose.yml` embarqué dans OverMind lorsque vous montez en mode "Dev".

### Court Terme

3. **Activer Temporal** : Réactiver le service Temporal dans votre `docker-compose.yml` d'infrastructure avec une DB dédiée et tester le `longRunningWorkflow`.
4. **Intégrer Redis** : Connecter Redis aux Runners pour la persistance du contexte (réponse à l'Open Question 2 de votre plan d'implémentation).

### Mise à Jour Roadmap

5. **Cocher les cases** de la roadmap (Phases 2, 4 et 5 partiellement réalisées — voir tableau ci-dessus).

---

# Rapport de Déploiement & Relance (28 Mai 2026)

Toutes les actions requises pour mettre à jour les outils vers leurs dernières versions et redémarrer la flotte d'agents IA ont été exécutées avec succès sur le VPS.

## 1. Actions Réalisées

### A. Libération d'Espace Disque (Migration Docker Root)
* **Problème :** Le disque système `/` était saturé (3.5 Go libres), insuffisant pour pull et décompresser l'image officielle de Hermes (~5 Go).
* **Action :** Migration propre du stockage Docker `data-root` vers le second disque de données `/mnt/data/docker` (233 Go libres). Suppression des anciennes données sur `/var/lib/docker`.
* **Résultat :** **8.2 Go** de libres récupérés sur la partition système `/`, et Docker dispose de 227 Go sur le disque secondaire.

### B. Résolution du Conflit de Port de la Base pgvector
* **Action :** Reconfiguration de `overmind-postgres-pgvector` (le conteneur PostgreSQL dédié à OverMind) pour s'exécuter dans le réseau isolé `agents_db_net` sans mappage de port public (`5432:5432`). Cela évite les conflits avec le `pgvector-container` de WebCV sur le port 5432 de l'hôte.

### C. Déploiement d'OverMind-MCP (v2.8.6 + SSE Bearer Auth)
* **Code :** Compilation locale de la branche `feat/http-transport-auth` avec support HTTP/SSE et authentification via un Bearer Token à temps constant (protection contre les timing attacks).
* **Configuration :** 
  * Ajout des variables de connexion DB et de mémoire dans `/mnt/data/agents/.env`.
  * Création d'un fichier vide `/app/overmind-mcp/.env` pour contourner la vérification de présence physique d'un `.env` imposée par la bibliothèque d'embeddings.
* **Résultat :** Le conteneur `overmind_mcp` tourne de manière 100% stable en HTTP Stream (port 3000) :
  ```
  [Overmind] [READY] Serveur HTTP sur http://0.0.0.0:3000/mcp (Auth: bearer-token)
  ```

### D. Mise à jour de Hermes Agent (v0.14.0 - Foundation)
* **docker-compose.yml :** Remplacement du conteneur placeholder Node par l'image officielle `nousresearch/hermes-agent:latest` (v0.14.0).
* **Hardening :** Désactivation de `cap_drop: ALL` et `no-new-privileges` pour ce conteneur spécifique afin de permettre au système d'init `s6-overlay` interne d'opérer le changement de UID/GID et de démarrer les processus sous l'utilisateur non privilégié `hermes`.
* **Résultat :** Le conteneur `hermes_agent` a fini son initialisation et le service Gateway tourne en tâche de fond.

---

## 2. État Final de la Flotte IA

| Conteneur | Image | Statut | Rôle |
| :--- | :--- | :--- | :--- |
| `overmind_mcp` | `node:22-alpine` (Code local v2.8.6) | **Up (Stable)** | Cerveau & Serveur MCP (Port 3000) |
| `hermes_agent` | `nousresearch/hermes-agent:latest` (v0.14.0) | **Up (Stable)** | Agent persistant & Passerelle de messagerie |
| `overmind-postgres-pgvector` | `pgvector/pgvector:pg16` | **Up (Stable)** | Base vectorielle dédiée isolée |
| `redis_cache` | `redis:alpine` | **Up (Stable)** | Cache pour la mémoire court-terme |
| `pgvector-container` | `ankane/pgvector` | **Up (Stable)** | Base RAG WebCV globale (Host 5432) |
| `uptime-kuma` | `louislam/uptime-kuma:1` | **Up (Stable)** | Monitoring de l'infrastructure |

