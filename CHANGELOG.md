# Changelog

All notable changes to `discord-mcp-pro` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] — 2026-07-29

### ✨ Added
- **Message resolution system** (`src/tools/resolveMessage.ts`) — resolve messages by ID, URL, or cross-channel reference with cycle detection and maxDepth control
- **69 unit tests** across 5 test files:
  - `parseDiscordMessageUrl.test.ts` (11 tests) — URL parsing for discord.com, canary, ptb, discordapp.com, @me, HTTP, invalid, big IDs
  - `extractDiscordMessageUrls.test.ts` (13 tests) — extraction from content, embeds (description/url/fields), components (buttons), dedup
  - `serializeFullMessage.test.ts` (15 tests) — all enriched fields, reference, embeds, attachments, components, snapshots
  - `resolveDiscordMessage.test.ts` (16 tests) — direct resolution, cross-channel by reference/URL, cycle detection, maxDepth, 403/404 errors
  - `isResolveError.test.ts` (14 tests) — error detection vs success, formatting of 9 error codes
- **Shared test mocks** (`tests/mocks/discord.ts`) — MockMessage, MockChannel, MockClient + createMockClient() with channel/message registries and Discord error simulation (10003, 10008, 50001, etc.)
- **vitest.config.ts** — Node environment, forks pool, 15s timeout
- `get_embed_details` tool now accepts `messageUrl` parameter

### 🔧 Fixed
- **REFERENCE_CYCLE and MAX_DEPTH errors were silently swallowed** instead of being propagated — `resolveMessage.ts` now correctly surfaces these critical errors (detected by tests 8 and 9)
- Prebuild/postbuild scripts updated to handle `bin/launch.cjs` (was hardcoded to `launch.js` which was deleted)
- Structured errors are now distinct (9 resolve error codes: MISSING_ACCESS, MESSAGE_NOT_FOUND, REFERENCE_CYCLE, MAX_DEPTH, INVALID_URL, CHANNEL_NOT_FOUND, EMBED_NOT_FOUND, PARSE_ERROR, UNKNOWN)

### 🔄 Changed
- Discord IDs are now handled as **strings** (not numbers) to prevent precision loss on large snowflake IDs
- `editEmbed.ts` refactored (+200 lines of improvements)
- `unified.ts` and `embeds.ts` updated for consistency with new resolution system
- `discord-bridge.ts` and `index.ts` updated (+100 lines of improvements)
- Logger configuration cleaned up
