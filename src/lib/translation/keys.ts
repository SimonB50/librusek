/**
 * Query keys of the translation cache - a separate module so `client/auth.ts` can clear translations
 * without pulling the translation code into the start-up bundle.
 */

/** Cached translations - removed on login / logout, so one account's texts don't outlive its session. */
const TRANSLATION_KEY = ["app", "translation"] as const;
const STATUS_KEY = ["app", "translationStatus"] as const;

export {STATUS_KEY, TRANSLATION_KEY};
