#[cfg(target_os = "windows")]
pub fn force_always_on_bottom(window: &tauri::WebviewWindow) {
    use std::ffi::c_void;
    use windows::Win32::UI::WindowsAndMessaging::{
        SetWindowPos, HWND_BOTTOM, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE,
    };
    use windows::Win32::Foundation::HWND;

    // Tauri 2 exposes hwnd() directly on WebviewWindow
    if let Ok(hwnd_raw) = window.hwnd() {
        unsafe {
            let _ = SetWindowPos(
                HWND(hwnd_raw.0 as *mut c_void),
                HWND_BOTTOM,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            );
        }
    }
}
