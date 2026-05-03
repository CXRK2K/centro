use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::net::TcpListener;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use tiny_http::{Response, Server};

use crate::oauth_config;

const AUTH_ENDPOINT: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT: &str = "https://oauth2.googleapis.com/token";
const SCOPE: &str = "https://www.googleapis.com/auth/calendar.readonly";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GoogleTokens {
    pub access_token: String,
    #[serde(default)]
    pub refresh_token: Option<String>,
    pub expires_in: u64,
    pub token_type: String,
    #[serde(default)]
    pub scope: Option<String>,
}

/// Run the Google OAuth flow with PKCE on a localhost loopback.
/// Returns the resulting tokens. The frontend stores them via the
/// `token_set` command (keyring-backed).
#[tauri::command]
pub async fn oauth_start_google(app: AppHandle) -> Result<GoogleTokens, String> {
    if !oauth_config::is_configured() {
        return Err(
            "Google OAuth is not configured. See src-tauri/src/oauth_config.rs.".into(),
        );
    }

    // 1. Find a free port for the loopback server.
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    drop(listener);

    let redirect_uri = format!("http://127.0.0.1:{port}/oauth/callback");

    // 2. Build PKCE pair.
    let mut verifier_bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut verifier_bytes);
    let code_verifier = URL_SAFE_NO_PAD.encode(verifier_bytes);
    let mut hasher = Sha256::new();
    hasher.update(code_verifier.as_bytes());
    let code_challenge = URL_SAFE_NO_PAD.encode(hasher.finalize());

    // 3. Build a random state token.
    let mut state_bytes = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut state_bytes);
    let state = URL_SAFE_NO_PAD.encode(state_bytes);

    // 4. Open the system browser to Google's auth URL.
    let auth_url = format!(
        "{AUTH_ENDPOINT}?response_type=code&client_id={client_id}&redirect_uri={redirect}&scope={scope}&state={state}&code_challenge={challenge}&code_challenge_method=S256&access_type=offline&prompt=consent",
        client_id = encode(oauth_config::GOOGLE_CLIENT_ID),
        redirect = encode(&redirect_uri),
        scope = encode(SCOPE),
        state = encode(&state),
        challenge = encode(&code_challenge),
    );

    app.shell()
        .open(&auth_url, None)
        .map_err(|e| e.to_string())?;

    // 5. Spin up the loopback server, wait for callback (60s timeout).
    let server = Server::http(format!("127.0.0.1:{port}")).map_err(|e| e.to_string())?;
    let captured: Arc<Mutex<Option<(String, String)>>> = Arc::new(Mutex::new(None));

    let captured_clone = Arc::clone(&captured);
    let listener_thread = std::thread::spawn(move || {
        for request in server.incoming_requests() {
            let url = request.url().to_string();
            if let Some(query) = url.split_once('?').map(|x| x.1) {
                let mut code: Option<String> = None;
                let mut state_in: Option<String> = None;
                for pair in query.split('&') {
                    if let Some((k, v)) = pair.split_once('=') {
                        let v = decode(v);
                        match k {
                            "code" => code = Some(v),
                            "state" => state_in = Some(v),
                            _ => {}
                        }
                    }
                }
                if let (Some(c), Some(s)) = (code, state_in) {
                    *captured_clone.lock().unwrap() = Some((c, s));
                    let _ = request.respond(
                        Response::from_string(success_html()).with_header(
                            "Content-Type: text/html; charset=utf-8"
                                .parse::<tiny_http::Header>()
                                .unwrap(),
                        ),
                    );
                    break;
                }
            }
            let _ = request.respond(Response::from_string("missing code").with_status_code(400));
        }
    });

    let mut elapsed = Duration::ZERO;
    let pause = Duration::from_millis(200);
    let timeout = Duration::from_secs(60);
    loop {
        if listener_thread.is_finished() {
            break;
        }
        tokio::time::sleep(pause).await;
        elapsed += pause;
        if elapsed >= timeout {
            return Err("OAuth flow timed out (60s).".into());
        }
    }

    let (code, returned_state) = captured
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "OAuth callback never received a code.".to_string())?;

    if returned_state != state {
        return Err("OAuth state mismatch (possible CSRF).".into());
    }

    // 6. Exchange code for tokens.
    let client = reqwest::Client::new();
    let resp = client
        .post(TOKEN_ENDPOINT)
        .form(&[
            ("client_id", oauth_config::GOOGLE_CLIENT_ID),
            ("client_secret", oauth_config::GOOGLE_CLIENT_SECRET),
            ("code", &code),
            ("code_verifier", &code_verifier),
            ("redirect_uri", &redirect_uri),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("token exchange failed ({status}): {body}"));
    }

    let tokens: GoogleTokens = resp.json().await.map_err(|e| e.to_string())?;
    Ok(tokens)
}

/// Refresh an access token using a stored refresh token.
#[tauri::command]
pub async fn oauth_refresh_google(refresh_token: String) -> Result<GoogleTokens, String> {
    if !oauth_config::is_configured() {
        return Err("Google OAuth is not configured.".into());
    }
    let client = reqwest::Client::new();
    let resp = client
        .post(TOKEN_ENDPOINT)
        .form(&[
            ("client_id", oauth_config::GOOGLE_CLIENT_ID),
            ("client_secret", oauth_config::GOOGLE_CLIENT_SECRET),
            ("refresh_token", &refresh_token),
            ("grant_type", "refresh_token"),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("token refresh failed ({status}): {body}"));
    }
    let mut tokens: GoogleTokens = resp.json().await.map_err(|e| e.to_string())?;
    // Google returns no refresh_token on refresh; reuse the input.
    if tokens.refresh_token.is_none() {
        tokens.refresh_token = Some(refresh_token);
    }
    Ok(tokens)
}

fn encode(s: &str) -> String {
    url::form_urlencoded::byte_serialize(s.as_bytes()).collect()
}

fn decode(s: &str) -> String {
    url::form_urlencoded::parse(format!("v={s}").as_bytes())
        .next()
        .map(|(_, v)| v.into_owned())
        .unwrap_or_else(|| s.to_string())
}

fn success_html() -> String {
    r#"<!doctype html>
<html><head><meta charset="utf-8"><title>Centro · Connected</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  display: flex; align-items: center; justify-content: center; height: 100vh;
  margin: 0; background: #0b0d10; color: #e6e8eb; }
.card { text-align: center; padding: 2rem 3rem; border-radius: 16px;
  background: #14171c; box-shadow: 0 20px 40px -20px rgba(0,0,0,.6); }
h1 { margin: 0 0 .5rem; font-weight: 600; }
p { margin: 0; color: #9aa0a6; }
</style></head><body>
<div class="card"><h1>Connected</h1><p>You can close this tab and return to Centro.</p></div>
</body></html>"#
        .to_string()
}
