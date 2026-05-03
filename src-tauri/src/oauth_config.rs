// Google OAuth client credentials for Centro.
//
// These values are NOT secret in the security sense for desktop apps —
// Google permits public client IDs for installed apps and we use PKCE
// to protect the auth flow. However, you must generate your own and
// paste them here before the Calendar widget will work.
//
// Setup steps (one-time, ~10 minutes):
//   1. https://console.cloud.google.com → create a project named "Centro"
//   2. Enable the Google Calendar API
//   3. APIs & Services → Credentials → Create Credentials → OAuth client ID
//      → Application type: "Desktop app"
//   4. Paste client_id below; client_secret is required by Google for
//      desktop apps but is not actually a secret.
//
// If left as the placeholder values, the Calendar widget will display a
// friendly "Configure Google OAuth" message instead of crashing, and the
// rest of Centro (Tasks, Notes, Time, Weather) ships normally.

pub const GOOGLE_CLIENT_ID: &str = "REPLACE_ME.apps.googleusercontent.com";
pub const GOOGLE_CLIENT_SECRET: &str = "REPLACE_ME";

pub fn is_configured() -> bool {
    !GOOGLE_CLIENT_ID.starts_with("REPLACE_ME")
        && !GOOGLE_CLIENT_SECRET.starts_with("REPLACE_ME")
}
