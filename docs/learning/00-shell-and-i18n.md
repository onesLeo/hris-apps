# Shell and i18n

This note explains the shared Aurora shell and the locale layer that powers EN and ID.
It is the best starting point before reading any screen-specific module.

## What this layer owns

- the top-level app frame
- sidebar navigation
- mobile navigation
- header search and locale switch
- shared screen routing
- shared shell strings such as brand text, menu labels, and chrome copy

Key files:
- [apps/web/src/components/aurora-app.tsx](../../apps/web/src/components/aurora-app.tsx)
- [apps/web/src/components/aurora-shell-data.ts](../../apps/web/src/components/aurora-shell-data.ts)
- [apps/web/src/i18n/app-copy.ts](../../apps/web/src/i18n/app-copy.ts)
- [apps/web/src/i18n/locale-provider.tsx](../../apps/web/src/i18n/locale-provider.tsx)
- [apps/web/src/i18n/locale-toggle.tsx](../../apps/web/src/i18n/locale-toggle.tsx)
- [apps/web/src/i18n/index.ts](../../apps/web/src/i18n/index.ts)

## Flow

1. `AuroraApp` mounts the `LocaleProvider`.
2. `AuroraAppShell` reads `locale` and `isTransitioning` from the provider.
3. `getAppCopy(locale)` returns shell strings for the active language.
4. The header and sidebar use shared shell copy.
5. The main area renders one active screen component at a time.
6. The locale toggle updates provider state and the screen fades smoothly.

## Java equivalent

- `AuroraApp` is similar to a Spring MVC layout controller or a Thymeleaf base template.
- `LocaleProvider` is similar to a scoped config bean or request context holder.
- `getAppCopy(locale)` is similar to a message source or `ResourceBundle`.
- `aurora-shell-data.ts` is similar to a menu registry or static UI constants class.

## How to debug

- If the page does not switch screens, check the active item in `AuroraAppShell`.
- If language switching does not animate, check `LocaleProvider` and the `isTransitioning` class.
- If menu labels are wrong, check `app-copy.ts` and the `nav` or `screenInfo` maps.
- If a feature appears as `Soon`, check `ACTIVE_FEATURE_KEYS` in `aurora-shell-data.ts`.

## Why this matters

Keeping the shell separate from screen modules gives us clean boundaries:

- the shell owns navigation and layout
- screens own their business UI
- locale data is isolated from component structure
- later API integration can replace mock screens without rewriting the frame

