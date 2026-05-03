use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_sql::{Migration, MigrationKind};

mod oauth;
mod oauth_config;
mod shortcuts;
mod tokens;
mod tray;

const MIGRATIONS_SQL: &str = include_str!("../migrations/001_init.sql");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create initial tables",
        sql: MIGRATIONS_SQL,
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:centro.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            // System tray + menu.
            tray::setup(app.handle())?;

            // Global shortcut plugin (desktop only).
            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_global_shortcut::Builder::new().build())?;
                shortcuts::register_default(app.handle())?;
            }

            Ok(())
        })
        // Hide-to-tray on close.
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            oauth::oauth_start_google,
            oauth::oauth_refresh_google,
            shortcuts::rebind_shortcut,
            tokens::token_set,
            tokens::token_get,
            tokens::token_delete,
            cmd_show_window,
            cmd_hide_window,
            cmd_toggle_window,
            cmd_quit,
            cmd_oauth_configured,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Centro");
}

#[tauri::command]
fn cmd_show_window(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

#[tauri::command]
fn cmd_hide_window(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.hide();
    }
}

#[tauri::command]
fn cmd_toggle_window(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        if w.is_visible().unwrap_or(false) {
            let _ = w.hide();
        } else {
            let _ = w.show();
            let _ = w.set_focus();
        }
    }
}

#[tauri::command]
fn cmd_quit(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn cmd_oauth_configured() -> bool {
    oauth_config::is_configured()
}
