# Librusek – dokumentacja techniczna

Jak działa aplikacja od środka i jak ją rozwijać. Krótki opis projektu i uruchamianie: [README.md](README.md).

- [Stos i struktura](#stos-i-struktura)
- [Komunikacja z Librusem](#komunikacja-z-librusem)
- [Warstwa danych](#warstwa-danych)
- [Logowanie i konta](#logowanie-i-konta)
- [Wiadomości](#wiadomości)
- [UI, i18n, motywy](#ui-i18n-motywy)
- [Tłumaczenie treści ze szkoły](#tłumaczenie-treści-ze-szkoły)
- [Analityka](#analityka)
- [Aktualizacje](#aktualizacje)
- [Platformy natywne](#platformy-natywne)
- [CI i wydania](#ci-i-wydania)
- [Znane braki](#znane-braki)

## Stos i struktura

React 19 (z React Compiler), TypeScript, Vite, Tailwind 4 + daisyUI 5, wouter (routing), TanStack Query v5 (dane),
i18next, Biome (lint). Aplikacja natywna przez Capacitor 8 (Android, iOS). Yarn 1, Node 22.

```
src/
├── client/          # wszystko, co rozmawia z Librusem: URL-e, transport, sesja, logowanie, zasoby (endpointy), typy
├── components/      # wspólne klocki UI: layout, modal, page (PageHeader, Tile, EmptyState…), queryState, translate
├── pages/<strona>/  # strony ładowane leniwie (pages/index.ts), komponenty strony w components/
├── lib/             # logika bez UI: daty, oceny, frekwencja, html (DOMPurify), preferencje, updater, analityka, tłumaczenie
├── locales/<lang>/  # tłumaczenia UI, jedna przestrzeń nazw na plik (pl to źródło)
├── i18n/            # konfiguracja i18next
└── providers/       # QueryClient, obsługa błędów
android/  ios/       # projekty Capacitora
scripts/             # check-locales.mjs
.github/             # workflowy i wspólna akcja setup
```

Strona startowa po zalogowaniu to `/app/home`, logowanie – `/auth`.

## Komunikacja z Librusem

- Synergia API 2.0 (`synergia.librus.pl/gateway/api/2.0`), wiadomości (`wiadomosci.librus.pl`)
  i logowanie OAuth (`api.librus.pl`). Wszystkie adresy są w `src/client/paths.ts`.
- `lib/http.ts` (`HttpClient`) wpuszcza tylko adresy `*.librus.pl`. Na urządzeniu `fetch` idzie natywnie przez CapacitorHttp
  (`capacitor.config.json`, bez CORS); w trybie dev – przez proxy Vite `/proxy/<host>/<ścieżka>` (`vite.config.ts`). Proxy trzyma ciasteczka **osobno dla każdej domeny**
  (inaczej `DZIENNIKSID` wiadomości nadpisuje ten z Synergii) i zwraca przekierowania w nagłówku `x-upstream-location`.
- Build web bez proxy nie połączy się z Librusem (CORS) – web służy do developmentu, docelowo działa tylko aplikacja Capacitor.
- Zapisy: logowanie (`POST` w `client/auth.ts`) i oznaczenie ogłoszenia jako przeczytanego (`POST SchoolNotices/MarkAsRead/{id}`).
  Otwarcie nieprzeczytanej wiadomości oznacza ją jako przeczytaną po stronie API. Poza tym tylko `GET`.

## Warstwa danych

```
src/client/
├── paths.ts        # URL-e
├── request.ts      # buildUrl, raw(), get() – rozpakowanie koperty (`envelope`) + camelCase, odzyskanie sesji po 401; send() dla POST
├── session.ts      # refreshSynergia (/refreshToken), ensureMessages (łańcuch /wiadomosci3), recover(url)
├── errors.ts       # RequestError (kind, status, auth, retryable, body)
├── auth.ts         # AuthManager: authorize / refreshSession / logout, AuthError z kodami
├── query/
│   ├── client.ts   # jeden QueryClient + onAuthError (401 -> /auth)
│   ├── batcher.ts  # DataLoader: id zebrane w 10 ms -> jedno /Resource/0,1,2
│   └── resource.ts # defineResource / defineDictionary / defineInfiniteResource / combineResults
├── resources/      # definicje endpointów (Grades, Subjects, Timetable, Messages…)
└── types/          # typy po normalizacji (camelCase), wspólny `Ref`
```

Komponenty pytają same o to, czego potrzebują – zapytania o ten sam klucz są współdzielone przez cache TanStack Query,
więc danych nie przekazuje się propsami ani kontekstem.

| Rodzaj | Przykład | Hooki | Cache |
|---|---|---|---|
| `defineResource` – jeden endpoint, opcjonalnie z parametrami | `Grades`, `Me`, `Timetable({weekStart})` | `X.useQuery(params?, {select, enabled})` | 1 min |
| `defineDictionary` – encje po id, pobierane paczkami | `Subjects`, `Users`, `GradeCategories` | `X.useOne(id)`, `X.useMany(ids)`, `X.useAll()` | bez wygasania |
| `defineInfiniteResource` – listy stronicowane | `Messages({box, category})` | `X.useInfinite(params)` | 1 min |

```tsx
const {data: grades} = Grades.useQuery();
const subjects = Subjects.useMany(grades?.map(g => g.subject.id) ?? []); // jedno /Subjects/0,...

const Grade = ({grade}) => {
  const {data: teacher} = Users.useOne(grade.addedBy.id); // wszystkie <Grade> razem -> jedno /Users/0,...
};

const {data: count} = Grades.useQuery(undefined, {select: g => g.length}); // re-render tylko gdy zmieni się wynik
```

Zasady:
- Hooki zasobów muszą się nazywać `use` + wielka litera (`useQuery`, `useOne`). React Compiler nie uzna `X.use()` za hook
  i zmemoizuje wywołanie – zapytanie nigdy nie wystartuje.
- Ładowanie i błędy: `<QueryState query={…}>{data => …}</QueryState>` (działa też z `useMany()` i `combineResults()`).
- Kilka kolekcji naraz: `useQueries` + `combineResults` (np. `useAllGrades` w `resources/grades.ts`).
- Poza Reactem: `X.fetch()`, `X.prefetch()`, `X.invalidate()`, `Dictionary.fetchMany(ids)`.
- Opcje zasobu: `request` (query, `envelope`, `format: "raw"`), `transform`, `afterFetch` (efekty uboczne), `prepare` (np. `Session.ensureMessages`).
- Id liczbowe przychodzące jako string są normalizowane – `useOne("12")` i `useOne(12)` to ten sam wpis.
- 401: `Request` najpierw odzyskuje sesję (`Session.recover` – Synergia przez `GET /refreshToken`, wiadomości przez ponowną aktywację).
  Dopiero drugi 401 albo przekierowanie zamiast JSON-a kończy się przejściem do `/auth` (poza zakładką Developer i API wiadomości –
  tam błąd pokazuje się w miejscu). Inne 4xx nie są ponawiane.
- Podgląd cache na żywo: **Developer → Cache** (zakładka widoczna po włączeniu trybu deweloperskiego w Ustawieniach),
  w trybie dev także React Query Devtools.

Nowy endpoint:
1. URL w `paths.ts`.
2. Typ w `types/<obszar>.ts` – pola potwierdzone na żywej odpowiedzi jako wymagane, reszta `?`.
   Kształt najłatwiej sprawdzić w **Developer → Request** z „Show as app sees it”.
   Odpowiedź z kilkoma kluczami w kopercie → `request: () => ({envelope: "Klucz"})` albo `format: "raw"` + `transform`.
3. `defineResource` / `defineDictionary` w `resources/<obszar>.ts`.

## Logowanie i konta

- `AuthManager.authorize` przechodzi logowanie OAuth Synergii; błędy mają kody (`AuthError.code` → `auth:errors.*`).
- Zapisane konta (`client/accounts.ts`): `capacitor-secure-storage-plugin` (Keystore / Keychain). Na webie localStorage bez szyfrowania – UI o tym ostrzega.
- Konto domyślne loguje się automatycznie raz na uruchomienie (flaga w `sessionStorage`), nigdy po ręcznym wylogowaniu.
- Logowanie i wylogowanie czyści tylko zapytania pod `ROOT_KEY` (preferencje i konta zostają), potem pełne przeładowanie do `/app/home`.
- Utrzymanie sesji: `useSessionKeepAlive` w `Layout`.

## Wiadomości

- Sesja: `Session.ensureMessages()` przechodzi krok po kroku `synergia.librus.pl/wiadomosci3` → `wiadomosci.librus.pl/…/MultiDomainLogon/…` → `/nowy`
  (każdy krok zapisuje ciasteczka) i sprawdza wynik przez `GET /api/me`. Jest w `prepare` każdego zasobu wiadomości.
- Kategorie (`MessageCategory`): uwagi `1,6`, alerty `2`, zastępstwa `3`, eUsprawiedliwienia `5`.
- Treść jest w base64; bywa opakowana w `<Message><Content><![CDATA[…]]></Content><Actions>…</Actions></Message>` – `lib/text.ts` → `messageBody()`.
  Szczegóły z archiwum mają treść w polu `Message` (wysłane) albo `content` (kosz).
- HTML z Librusa zawsze przez DOMPurify (`lib/html.ts`, `components/richText.tsx`).

## UI, i18n, motywy

- Szczegóły otwierają się w modalach (`components/modal.tsx`). Daty: `lib/date.ts` (`DateUtils`, czas lokalny, format wg języka).
- Ikony: Remix Icon (`@remixicon/react`). Logo: `src/assets/logo.svg` (komponent `components/logo.tsx`), favicon i ikony PWA w `public/`,
  oryginał w `assets/icon.svg`. Ikony i splash Androida w `android/app/src/main/res`, iOS w `ios/App/App/Assets.xcassets`.
- Języki: pl (źródło), en, ru, uk. Pliki w `src/locales/<lang>/<przestrzeń>.json` ładowane przez `import.meta.glob`.
  Język z preferencji albo z `navigator.languages` (`ua` → `uk`, domyślnie `en`).
  `yarn check:locales` porównuje wszystkie języki z pl (pliki, klucze, `{{zmienne}}`, formy liczby mnogiej) – działa też w CI.
- Motywy daisyUI: atrybut `data-theme` z preferencji, ustawiany skryptem w `index.html` przed startem Reacta (bez mignięcia).
- Preferencje: Capacitor Preferences (`lib/preferences.ts`, `usePreference`).
- Strony są osobnymi chunkami (`lazy()` w `pages/index.ts`, `Suspense` w `Layout`).

## Tłumaczenie treści ze szkoły

`lib/translation/` + `components/translate.tsx`. Treści z Librusa (pl) można przetłumaczyć na język aplikacji.

- Silniki: ML Kit (`@capacitor-mlkit/translation`) na urządzeniu, wbudowany `Translator` w Chrome 138+ na komputerze,
  pseudo-silnik tylko w buildzie dev.
- Modele pobiera się świadomie (Ustawienia → Tłumaczenie, z listą i usuwaniem); bez modelu nic się nie tłumaczy.
- `TranslationScope` + `TranslateToggle` w modalach, `<T>` dla tekstów i nazw słownikowych, `RichText` tłumaczy węzły tekstowe HTML.
  Nazwisk nie tłumaczymy. Po polsku funkcja jest ukryta.

## Analityka

- Firebase Analytics (`@capacitor-firebase/analytics`), projekt `librusek-3401c`.
  Konfiguracja: `android/app/google-services.json`, `ios/App/App/GoogleService-Info.plist`.
- `lib/analytics.ts` (`ScreenTracker` w `app.tsx`) wysyła tylko `screen_view` z nazwą ekranu – bez danych osobowych. Web: no-op.
- Wyłączenie: Ustawienia → Prywatność (preferencja `analytics`, `"false"` = wyłączona → `setEnabled(false)`).
- Bez identyfikatora reklamowego: Android – `google_analytics_adid_collection_enabled=false` i usunięte uprawnienia
  `AD_ID` / `ACCESS_ADSERVICES_*` w manifeście; iOS – pod `AnalyticsWithoutAdIdSupport`.

## Aktualizacje

```
Updater.check()  ->  "upToDate" | "available"  ->  Updater.install(release)  ->  instalator systemowy
```

- `lib/updater.ts`: `check()` pobiera `releases/latest` z `SimonB50/librusek`, zdejmuje `v` z tagu i porównuje z `__APP_VERSION__`
  (z `package.json`, wstrzykiwane przez Vite). Na Androidzie sprawdza samo przy starcie (wynik ważny 6 h), gdzie indziej – z modalu wersji na stronie głównej.
- `install()` (Android) używa lokalnego pluginu `ApkInstaller` (`android/app/src/main/java/com/librusek/dev/ApkInstallerPlugin.java`,
  rejestrowany w `MainActivity`):
  - przyjmuje tylko `https://github.com/SimonB50/librusek/releases/download/….apk`;
  - pobiera do `cache/updates` ze zdarzeniami `progress`, odrzuca drugie równoległe pobieranie (`BUSY`);
  - sprawdza rozmiar, nazwę pakietu i wyższy `versionCode` (`SIZE_MISMATCH`, `INVALID_PACKAGE`), potem otwiera instalator
    przez `FileProvider` (`REQUEST_INSTALL_PACKAGES`). Podpis sprawdza już Android.
- Stara aplikacja 1.x szuka tego samego: `releases/latest` + `librusek-<wersja>.apk`.
- iOS: tylko informacja o nowej wersji.
- Nazwa repozytorium jest wpisana w trzech miejscach: `updater.ts`, `ApkInstallerPlugin.java`, `release.yml` (`UPDATER_REPOSITORY`).

## Platformy natywne

- Natywny `fetch` (CapacitorHttp) sam podąża za przekierowaniami mimo `redirect: "manual"` – `HttpClient.follow` obsługuje
  też zwykłe `3xx` + `location`, a `Session.ensureMessages` i tak weryfikuje sesję przez `/api/me`.
- `appId`: `com.librusek.dev` (taki sam jak w 1.x – aktualizacja instaluje się na starej wersji, jeśli APK ma ten sam podpis).
- Wersja: `package.json` → Android `versionName`, `versionCode = major·10000 + minor·100 + patch` (`android/app/build.gradle`), iOS w workflow wydania.
- Po zmianie zależności natywnych lub buildu web: `yarn build && yarn cap sync`.
- Android wymaga JDK 21. Podpisany build lokalnie: zmienne `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
  `ANDROID_KEY_PASSWORD`, potem `gradlew :app:assembleRelease` w `android/`.
- `yarn dev:mobile` uruchamia Vite i aplikację na Androidzie z live reload – adres hosta w `dev:cap` (`package.json`) trzeba ustawić na swój.
- iOS: CocoaPods (ML Kit nie ma SPM), deployment target 15.5, `ios.contentInset: "always"`. Na Macu: `cd ios/App && pod install`,
  otworzyć `App.xcworkspace`, ustawić zespół i podpisywanie.

## CI i wydania

| Workflow | Kiedy | Co robi |
|---|---|---|
| `web.yml` | push na `main`/`master`, PR, ręcznie | Biome, `check:locales`, `tsc` + build web |
| `android.yml` | zmiany w `android/`, zależnościach, konfiguracji Capacitora; ręcznie | debug APK jako artefakt |
| `ios.yml` | zmiany w `ios/`, zależnościach, konfiguracji Capacitora; ręcznie | `pod install` + niepodpisany build na symulator |
| `release.yml` | tylko ręcznie (Actions → Release → Run workflow) | podpisany APK + niepodpisany IPA → wydanie i tag `v<wersja>` |

Wspólna instalacja: `.github/actions/setup` (Node 22, cache `node_modules` wg `yarn.lock`, opcjonalnie Java 21, Android SDK i cache Gradle).
iOS cache'uje CocoaPods.

Wydanie:
1. Podnieś wersję w `package.json` i wypchnij.
2. Uruchom **Release** w `SimonB50/librusek` na wybranej gałęzi. Opcje: `draft` (domyślnie szkic) i `ios`.
3. Szkic opublikuj na GitHubie z zaznaczonym „Set as the latest release” – updater nie widzi szkiców ani pre-release.

Workflow zatrzyma się, gdy wersja to `0.0.0`, tag już istnieje albo wersja nie jest większa od ostatniego wydania.
Ostrzeże, gdy działa poza `SimonB50/librusek`.

Sekrety repozytorium: `SIGNING_KEY` (keystore `.jks` w base64), `KEY_STORE_PASSWORD`, `ALIAS`, `KEY_PASSWORD`. Keystore musi być ten sam co w 1.x.
Base64 w PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("keystore.jks")) | Set-Clipboard`.

## Osobliwości API

Ustalone na żywych odpowiedziach – łatwo o nie potknąć się ponownie.

- `CalendarMonth` zwraca tylko część referencji (np. 6 z 52 zastępstw), więc kalendarz pobiera całe kolekcje i indeksuje je lokalnie.
- W szkołach z ocenami punktowymi plusy, minusy i `np` przychodzą jako zwykłe oceny – są pokazywane kolorem, liczone osobno („+2 −1”)
  i nie wchodzą do średniej. Ustawienie punktowe: `Units` → `gradesSettings.pointGradesEnabled`.
- Symulator ocen trzyma oceny tylko lokalnie, z ujemnymi id.
- `note.positive`: `0` negatywna, `1` pozytywna, `2` prawdopodobnie neutralna.
- `/Timetables` podaje id jako stringi (normalizowane w warstwie danych).
- Odpowiedzi z kilkoma kluczami w kopercie: `{Users, pagination}`, `{lendings, lastSynchronizationTimestamp}`.
- `Justifications` zwraca 403, gdy szkoła ma moduł wyłączony; `/NotificationCenter` – 500; `SpecialAchievement` – 404 (dla testowanego konta).
- Łańcuch sesji wiadomości kończy się na `http://wiadomosci.librus.pl/nowy/` (http) – `follow` tam staje, sesja już jest.
- Wcześniej wiadomości nie działały, bo proxy trzymało ciasteczka wszystkich hostów razem i nikt nie szedł za przekierowaniami.
- Otwarcie nieprzeczytanej wiadomości (szczegóły) oznacza ją jako przeczytaną.
- Załączniki wiadomości: link `${downloadLink}/get` niezweryfikowany. Załączniki zadań, realizacji i planowanych lekcji mają id
  w formacie `<właściciel>-<załącznik>` (znaczenie niepotwierdzone).
- Powiadomienia push w oficjalnym kliencie: `POST /ChangeRegister` z `{provider: "FCM", device: <token>, sendPush: "1", appVersion: 4}`.

## Znane braki

Niesprawdzone na żywych danych (testowane konto ich nie miało):
- plusy/minusy i oceny opisowe, zadania domowe, zachowanie (zwykłe i punktowe), wycieczki, biblioteka, zakładka zastępstw;
- `note.positive = 2` (prawdopodobnie neutralna);
- pola z `?` i typy oznaczone „empty for the tested account” w `src/client/types/`.

Niesprawdzone na urządzeniu:
- logowanie zapisanym kontem, auto-login i przełączanie kont;
- logowanie i sesja wiadomości przez natywny HTTP (`HttpClient.follow` obsługuje też zwykłe `3xx` + `location`);
- „Pobierz dane osobowe” (Filesystem + Share), modele ML Kit offline;
- instalacja aktualizacji – pierwszy prawdziwy test możliwy z wydaniem > 2.0.0 podpisanym kluczem release; zgoda na nieznane źródła, Android 7;
- iOS w ogóle (projekt jest, ale nie był budowany ani uruchamiany).

Nie zaimplementowane:
- wysyłanie i odpowiadanie na wiadomości, kosz, tagi, filtry nadawca/odbiorca; pobieranie załączników na natywnym;
- pozostałe zapisy API (`HomeWorkAssignments`, `Surveys`, `Justifications`, `ChangeRegister`…), powiadomienia push (FCM + `POST /ChangeRegister`);
- sprawdzanie `SchoolModuleAccess` przed pokazaniem modułów zależnych od szkoły;
- zasoby bez UI: `Surveys`, `NotificationDeferrals`, `AccessibilitySettings`, `StudentDuties`, `ExamResults` (puste, typy niepotwierdzone),
  mikroserwisy `/gateway/ms/*` (świetlica, przedszkole, indywidualna ścieżka);
- przycisk „Set up with Librus account” na ekranie logowania;
- fallback uwag do wiadomości, gdy `/Notes` zwróci błąd;
- trwały cache między uruchomieniami (`@tanstack/query-sync-storage-persister`);
- release notes jako Markdown (teraz zwykły tekst);
- Developer: wysyłanie treści na paste.simonb50.xyz, metody inne niż GET;
- Crashlytics (był w 1.x).

Do decyzji:
- sortowanie przedmiotów w ocenach – teraz po `subject.no`, może alfabetycznie;
- godziny lekcji z `School` → `lessonsRange` – nieużywane;
- 1.x ukrywała nieobecności nauczycieli, których `Users` nie zwrócił – teraz są pokazywane.

Wstrzymane aktualizacje pakietów:
- `typescript` 7 – przed aktualizacją sprawdzić `tsc -b` i plugin React Compiler;
- `@babel/core` 8 – `babel-plugin-react-compiler@1.0` go nie wspiera;
- `@types/node` 26 – lokalnie Node 22, zostaje 24.x.
