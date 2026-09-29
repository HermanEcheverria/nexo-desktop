# Nexo para Windows

App de escritorio de [Nexo](https://github.com/HermanEcheverria/nexo-os), el sistema operativo de agentes que cuida tu PC. Es un
**cliente delgado**: el núcleo (agentes, planificador, base de datos) corre en WSL y esta app lo
muestra y lo controla.

- **Parte del día**, agentes con sus permisos y bitácora en vivo (SSE).
- **Ícono en la bandeja:** cerrar la ventana no apaga Nexo.
- **Arranca con Windows**, enciende el núcleo en WSL si no corre y te avisa con una notificación.
- **Una sola instancia**, y recuerda el tamaño y la posición de la ventana.

## Seguridad

- La interfaz no puede ejecutar comandos: la parte nativa (Rust) solo lanza `wsl.exe` y `wt.exe`
  con argumentos fijos. No se usa el plugin de shell.
- Permisos mínimos de Tauri (`src-tauri/capabilities/default.json`) y CSP estricta: solo se
  conecta a la API local `127.0.0.1:4747`.
- El token de la API lo lee la parte nativa desde `%LOCALAPPDATA%\Nexo\token` y viaja por IPC.

## Desarrollo (en Windows)

Requisitos: Node 22+, pnpm, Rust (MSVC) y Visual Studio Build Tools con C++.

```powershell
pnpm install
pnpm app        # abre la app (tauri dev)
pnpm check      # tipos + ESLint + pruebas
pnpm tauri build  # instalador NSIS en src-tauri/target/release/bundle
```

Vista previa en el navegador sin compilar Rust: `pnpm dev` con `VITE_NEXO_TOKEN` en `.env.local`.
