//! Puente con el núcleo de Nexo, que corre dentro de WSL.
//!
//! Los comandos son FIJOS: la interfaz no puede pasar argumentos a `wsl.exe`, así que
//! no hay forma de convertir un botón en un comando arbitrario.

use std::io::{Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::Duration;

/// Tu distribución de Ubuntu. Hay que nombrarla: la predeterminada es `docker-desktop`.
const DISTRO: &str = "Ubuntu";
/// Cómo se enciende el servicio dentro de WSL.
const START_SCRIPT: &str = "exec ~/Trabajo/nexo-os/bin/nexo servicio";
/// Tu estación de trabajo: la sesión de tmux de siempre.
const WORKSTATION_SCRIPT: &str = "~/iniciar_entorno.sh";

pub const PORT: u16 = 4747;

/// Sin ventana de consola al lanzar procesos desde la app.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

fn hidden(command: &mut Command) -> &mut Command {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    command
}

/// ¿Responde el servicio? Un GET mínimo a /estado, que no necesita token.
pub fn is_running() -> bool {
    let addr = SocketAddr::from(([127, 0, 0, 1], PORT));
    let Ok(mut stream) = TcpStream::connect_timeout(&addr, Duration::from_millis(400)) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_millis(800)));
    let request = format!("GET /estado HTTP/1.1\r\nHost: 127.0.0.1:{PORT}\r\nConnection: close\r\n\r\n");
    if stream.write_all(request.as_bytes()).is_err() {
        return false;
    }
    let mut response = String::new();
    let _ = stream.read_to_string(&mut response);
    response.starts_with("HTTP/1.1 200")
}

/// Enciende el núcleo en WSL, en segundo plano y sin ventana.
pub fn start() -> std::io::Result<()> {
    hidden(
        Command::new("wsl.exe")
            .args(["-d", DISTRO, "--", "bash", "-lc", START_SCRIPT])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null()),
    )
    .spawn()
    .map(|_| ())
}

/// Abre Windows Terminal con la sesión de tmux de trabajo.
pub fn open_workstation() -> std::io::Result<()> {
    Command::new("wt.exe")
        .args(["wsl.exe", "-d", DISTRO, "--", "bash", "-lc", WORKSTATION_SCRIPT])
        .spawn()
        .map(|_| ())
}

/// El servicio deja una copia de su token en %LOCALAPPDATA%\Nexo\token.
pub fn token_path() -> Option<PathBuf> {
    std::env::var_os("LOCALAPPDATA").map(|dir| PathBuf::from(dir).join("Nexo").join("token"))
}

pub fn read_token() -> Result<String, String> {
    let path = token_path().ok_or("No encontré %LOCALAPPDATA%")?;
    std::fs::read_to_string(&path)
        .map(|t| t.trim().to_owned())
        .map_err(|_| "El servicio todavía no ha creado su token".to_owned())
}
