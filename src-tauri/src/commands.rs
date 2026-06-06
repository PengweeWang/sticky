use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
pub async fn create_sticky(
    app: AppHandle,
    note_id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let label = format!("sticky-{}", note_id);

    WebviewWindowBuilder::new(
        &app,
        &label,
        WebviewUrl::App(format!("index.html?note={}", note_id).into()),
    )
    .inner_size(width, height)
    .position(x, y)
    .decorations(false)
    .skip_taskbar(true)
    .resizable(false)
    .visible(true)
    .transparent(true)
    .shadow(false)
    .always_on_bottom(true)
    .build()
    .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        if let Some(w) = app.get_webview_window(&label) {
            crate::window_utils::force_always_on_bottom(&w);
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn move_sticky(app: AppHandle, note_id: String, x: i32, y: i32) -> Result<(), String> {
    let label = format!("sticky-{}", note_id);
    let window = app
        .get_webview_window(&label)
        .ok_or("window not found")?;
    window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_sticky(app: AppHandle, note_id: String) -> Result<(), String> {
    let label = format!("sticky-{}", note_id);
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
