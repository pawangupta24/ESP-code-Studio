// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct DeviceInfo {
    device_id: String,
    port: String,
    chip: String,
}

#[tauri::command]
fn list_serial_devices() -> Vec<DeviceInfo> {
    vec![
        DeviceInfo {
            device_id: "SPRAYER-001".to_string(),
            port: "COM4".to_string(),
            chip: "ESP32-S3".to_string(),
        }
    ]
}

#[tauri::command]
fn ping_device(port: String) -> String {
    format!("Device on {} responded to PING with OK", port)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![list_serial_devices, ping_device])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
