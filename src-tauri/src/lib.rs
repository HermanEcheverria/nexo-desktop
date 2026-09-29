//! Nexo para Windows: un cliente delgado del núcleo que corre en WSL.

mod commands;
mod service;
mod tray;

use tauri::WindowEvent;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Una sola instancia: abrirla otra vez solo trae la ventana al frente
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            tray::show_main(app)
        }))
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .args(["--al-iniciar-sesion"])
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            tray::create(app.handle())?;

            // Solo la app instalada se registra para arrancar con Windows (no la de desarrollo)
            #[cfg(not(debug_assertions))]
            {
                use tauri_plugin_autostart::ManagerExt;
                let autostart = app.autolaunch();
                if !autostart.is_enabled().unwrap_or(false) {
                    let _ = autostart.enable();
                }
            }

            // Si el núcleo no corre, se enciende de una vez
            if !service::is_running() {
                if let Err(error) = service::start() {
                    log::error!("No pude encender el núcleo: {error}");
                }
            }
            Ok(())
        })
        // Cerrar la ventana la esconde en la bandeja; "Salir" está en el menú del ícono
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::ensure_service,
            commands::service_token,
            commands::open_workstation,
            commands::launched_at_login
        ])
        .run(tauri::generate_context!())
        .expect("error al iniciar Nexo");
}
