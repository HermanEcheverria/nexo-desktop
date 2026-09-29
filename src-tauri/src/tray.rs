//! Ícono en la bandeja del sistema: Nexo sigue trabajando aunque cierres la ventana.

use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Runtime};

pub fn show_main<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

pub fn create<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "abrir", "Abrir Nexo", true, None::<&str>)?;
    let workstation = MenuItem::with_id(
        app,
        "estacion",
        "Levantar estación de trabajo",
        true,
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app, "salir", "Salir de Nexo", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&open, &workstation, &separator, &quit])?;

    // Versión blanca y simplificada: se lee a 16 px sobre la barra de tareas oscura
    let icon = Image::from_bytes(include_bytes!("../icons/tray.png"))?;
    TrayIconBuilder::with_id("principal")
        .icon(icon)
        .tooltip("Nexo")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "abrir" => show_main(app),
            "estacion" => {
                if let Err(error) = crate::service::open_workstation() {
                    log::error!("No pude abrir la estación de trabajo: {error}");
                }
            }
            // Salir cierra la app; el núcleo en WSL sigue trabajando
            "salir" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}
