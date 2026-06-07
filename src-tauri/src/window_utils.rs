#[cfg(target_os = "windows")]
pub fn force_always_on_bottom(window: &tauri::WebviewWindow) {
    use std::ffi::c_void;
    use windows::Win32::UI::WindowsAndMessaging::{
        SetWindowPos, HWND_BOTTOM, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE,
    };
    use windows::Win32::Foundation::HWND;

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

#[cfg(target_os = "windows")]
pub fn exclude_from_alt_tab(window: &tauri::WebviewWindow) {
    use windows::Win32::UI::WindowsAndMessaging::{
        GetWindowLongW, SetWindowLongW, GWL_EXSTYLE,
        WS_EX_APPWINDOW, WS_EX_TOOLWINDOW,
    };

    if let Ok(hwnd_raw) = window.hwnd() {
        let hwnd = windows::Win32::Foundation::HWND(hwnd_raw.0 as *mut std::ffi::c_void);
        unsafe {
            let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
            // Ensure WS_EX_TOOLWINDOW is set and WS_EX_APPWINDOW is cleared
            // This excludes the window from Alt+Tab on Windows 10/11
            let new_style = (ex_style | WS_EX_TOOLWINDOW.0 as i32) & !(WS_EX_APPWINDOW.0 as i32);
            SetWindowLongW(hwnd, GWL_EXSTYLE, new_style);
        }
    }
}
