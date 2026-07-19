# NEXUS Watch Connectors

The connector layer keeps OAuth credentials in Electron, exposes only sanitized connection state to React, and requires a preview before synchronization writes.

## AniList configuration

1. Create an OAuth client from the AniList developer settings.
2. Register the exact redirect URI `nexus://oauth/anilist`.
3. Copy `.env.example` to `.env.local` for local development.
4. Set `NEXUS_ANILIST_CLIENT_ID` and `NEXUS_ANILIST_CLIENT_SECRET`.
5. Restart Electron. The renderer will show AniList as disconnected instead of configuration required.

NEXUS opens AniList in the system browser and uses the OAuth Authorization Code flow. The custom `nexus://` protocol returns the code to the existing Electron instance. The state is random, single-use, and expires after five minutes. Tokens are encrypted through Electron `safeStorage`; connection is refused if secure storage is unavailable.

For a distributed desktop build, do not ship a reusable client secret in the repository or renderer bundle. Use a developer-owned AniList application per installation or add a trusted backend OAuth broker before public distribution.

AniList's current terms prohibit using the API as a backup/hoarding service and restrict competing trackers unless they provide authorized, sustained AniList synchronization. Before distributing or commercializing NEXUS, the publisher must review those terms and request AniList authorization when the product classification requires it. The connector deliberately fetches only the authenticated user's list on demand and does not mass-collect catalog data.

## Implemented AniList behavior

- authenticated current user;
- paginated anime list pull;
- CURRENT, COMPLETED, PLANNING, DROPPED, PAUSED, and REPEATING mapping;
- episode progress and status mutation after explicit preview and Gateway confirmation;
- runtime validation for GraphQL and OAuth responses;
- bounded retries for read operations, no automatic retry for mutations;
- local matching by provider IDs, alternate titles, and year;
- manual-edit and progress conflicts kept out of execution until resolved.

AniList does not expose exact video playback position. NEXUS therefore stores episode progress as remote metadata and never invents seconds or a playback percentage.

## Simkl status

The registry, OAuth-PKCE configuration shape, UI portal, capability model, and extension interface exist. The network connector is intentionally disabled in this version. It remains `configuration-required` without `NEXUS_SIMKL_CLIENT_ID` and `unsupported` when configured, rather than simulating a successful connection.

Official Simkl documentation describes Public PKCE for desktop clients, incremental synchronization through activities followed by changed collections, and strict user/client rate limits. A future implementation must register a real client ID before enabling those capabilities.

## Official references

- AniList authentication: https://docs.anilist.co/guide/auth/
- AniList authorization code flow: https://docs.anilist.co/guide/auth/authorization-code
- AniList GraphQL guide: https://docs.anilist.co/guide/graphql/
- AniList rate limiting: https://docs.anilist.co/guide/rate-limiting/
- AniList API terms: https://docs.anilist.co/guide/terms-of-use/
- Simkl API documentation: https://api.simkl.org/
- Simkl authentication: https://api.simkl.org/authentication
- Simkl rate limits: https://api.simkl.org/resources/rate-limits
- Simkl synchronization: https://api.simkl.org/guides/sync
- Simkl application registration: https://simkl.com/settings/developer/
