use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[cfg(target_os = "macos")]
const DEFAULT_MODS: Modifiers = Modifiers::SUPER.union(Modifiers::SHIFT);

#[cfg(not(target_os = "macos"))]
const DEFAULT_MODS: Modifiers = Modifiers::CONTROL.union(Modifiers::SHIFT);

const DEFAULT_KEY: Code = Code::Space;

pub fn register_default(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(Some(DEFAULT_MODS), DEFAULT_KEY);
    let app_handle = app.clone();
    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                if let Some(w) = app_handle.get_webview_window("main") {
                    if w.is_visible().unwrap_or(false) {
                        let _ = w.hide();
                    } else {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
            }
        })?;
    Ok(())
}

/// Rebind the global shortcut to a new chord. Modifiers and key are passed as strings.
/// Examples: mods = "ctrl+shift", key = "D"
#[tauri::command]
pub fn rebind_shortcut(
    app: AppHandle,
    mods: String,
    key: String,
) -> Result<(), String> {
    // Unregister all and register the new one.
    app.global_shortcut().unregister_all().map_err(|e| e.to_string())?;

    let mut modifiers = Modifiers::empty();
    for m in mods.split('+').map(|s| s.trim().to_lowercase()) {
        match m.as_str() {
            "cmd" | "command" | "super" | "meta" | "win" => modifiers |= Modifiers::SUPER,
            "ctrl" | "control" => modifiers |= Modifiers::CONTROL,
            "shift" => modifiers |= Modifiers::SHIFT,
            "alt" | "option" => modifiers |= Modifiers::ALT,
            "" => {}
            other => return Err(format!("unknown modifier: {other}")),
        }
    }

    let code = parse_code(&key).ok_or_else(|| format!("unknown key: {key}"))?;
    let shortcut = Shortcut::new(Some(modifiers), code);
    let app_handle = app.clone();
    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                if let Some(w) = app_handle.get_webview_window("main") {
                    if w.is_visible().unwrap_or(false) {
                        let _ = w.hide();
                    } else {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
            }
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn parse_code(key: &str) -> Option<Code> {
    let upper = key.trim().to_uppercase();
    Some(match upper.as_str() {
        "SPACE" => Code::Space,
        "ENTER" | "RETURN" => Code::Enter,
        "ESC" | "ESCAPE" => Code::Escape,
        "TAB" => Code::Tab,
        "A" => Code::KeyA,
        "B" => Code::KeyB,
        "C" => Code::KeyC,
        "D" => Code::KeyD,
        "E" => Code::KeyE,
        "F" => Code::KeyF,
        "G" => Code::KeyG,
        "H" => Code::KeyH,
        "I" => Code::KeyI,
        "J" => Code::KeyJ,
        "K" => Code::KeyK,
        "L" => Code::KeyL,
        "M" => Code::KeyM,
        "N" => Code::KeyN,
        "O" => Code::KeyO,
        "P" => Code::KeyP,
        "Q" => Code::KeyQ,
        "R" => Code::KeyR,
        "S" => Code::KeyS,
        "T" => Code::KeyT,
        "U" => Code::KeyU,
        "V" => Code::KeyV,
        "W" => Code::KeyW,
        "X" => Code::KeyX,
        "Y" => Code::KeyY,
        "Z" => Code::KeyZ,
        "1" => Code::Digit1,
        "2" => Code::Digit2,
        "3" => Code::Digit3,
        "4" => Code::Digit4,
        "5" => Code::Digit5,
        "6" => Code::Digit6,
        "7" => Code::Digit7,
        "8" => Code::Digit8,
        "9" => Code::Digit9,
        "0" => Code::Digit0,
        _ => return None,
    })
}
