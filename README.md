<p align="center">
  <img src="assets/icon.svg" alt="" width="96"/>
</p>

<h1 align="center">Librusek</h1>

<p align="center">Unofficial mobile app for Librus Synergia.</p>

<p align="center">
  <a href="https://github.com/SimonB50/librusek/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/SimonB50/librusek"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/SimonB50/librusek"></a>
</p>

You sign in with your regular Synergia login. The app talks only to Librus servers – there is no backend of its own.

## Features

- grades with averages (point-based too) and a grade simulator,
- timetable with substitutions, calendar, exams, homework,
- attendance with statistics, notes, behaviour,
- messages (read-only) and school announcements,
- teacher absences, school files, trips, library,
- multiple saved accounts with automatic sign-in,
- Polish, English, Russian and Ukrainian UI, plus on-device translation of school content,
- light, dark and a few dozen other themes.

## Download

**Android** – the `.apk` from the [latest release](https://github.com/SimonB50/librusek/releases/latest).
The app finds new versions, downloads them and installs them after you confirm.

**iOS** – releases may include an unsigned `.ipa` to sign yourself (e.g. AltStore, Sideloadly).
The iOS build is not tested yet.

## Privacy

Your login and password go only to Librus. Saved accounts are kept in the system's encrypted storage (Keystore / Keychain).
Firebase Analytics receives only the names of opened screens, without an advertising ID – you can turn it off
in Settings → Privacy.

## Development

Requirements: Node 22, Yarn 1; for Android JDK 21 and the Android SDK; for iOS a Mac with Xcode and CocoaPods.

```sh
yarn install
yarn dev:web          # app in the browser (with a proxy to Librus)
yarn ci:check         # Biome + translation consistency
yarn build            # tsc + web build
yarn cap sync         # copy the build into android/ and ios/
```

Android: `cd android && ./gradlew :app:assembleDebug`. Architecture, data layer, releases and known gaps: [DOCS.md](DOCS.md) (in Polish).

Report bugs and ideas in [Issues](https://github.com/SimonB50/librusek/issues).

## Credits

The idea came from [Librusik](https://github.com/dani3l0/librusik) by [dani3l0](https://github.com/dani3l0).

## License

[AGPL-3.0](LICENSE). Not affiliated with Librus Sp. z o.o.
