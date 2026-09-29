//! Lo único que la interfaz puede pedirle a la parte nativa.

use serde::Serialize;

use crate::service;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ServiceState {
    /// Ya respondía.
    Running,
    /// No respondía y se mandó a encender.
    Starting,
}

/// Se asegura de que el núcleo esté encendido.
#[tauri::command]
pub async fn ensure_service() -> Result<ServiceState, String> {
    if service::is_running() {
        return Ok(ServiceState::Running);
    }
    service::start().map_err(|e| format!("No pude encender Nexo en WSL: {e}"))?;
    Ok(ServiceState::Starting)
}

/// Token para hablar con la API local. Viaja por IPC, nunca por la red.
#[tauri::command]
pub fn service_token() -> Result<String, String> {
    service::read_token()
}

#[tauri::command]
pub fn open_workstation() -> Result<(), String> {
    service::open_workstation().map_err(|e| format!("No pude abrir la terminal: {e}"))
}

/// Si Windows abrió la app al iniciar sesión (el autoarranque pasa este argumento).
#[tauri::command]
pub fn launched_at_login() -> bool {
    std::env::args().any(|arg| arg == "--al-iniciar-sesion")
}
