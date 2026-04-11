# 🎮 Millionaire Overlay - Front-end

Este proyecto es la interfaz visual del sistema de trivias "¿Quién quiere ser millonario?". Contiene tanto el panel de control para el administrador como la vista de overlay optimizada para transmisiones en vivo vía OBS.

## 🛠 Funcionalidades Principales

Este repositorio centraliza tres componentes clave para el funcionamiento del sistema:

1. **Panel de Administración (`/admin`)**: Es el centro de mando. Permite al administrador gestionar las preguntas, avanzar niveles, activar comodines y sincronizar el estado del juego con los espectadores en tiempo real.
2. **Overlay de OBS (`/overlay/game`)**: Una vista limpia y optimizada para ser capturada como fuente de navegador en software de streaming, con animaciones fluidas y soporte para transparencia.
3. **Página de Prueba e Índice (`/`)**: Un punto de entrada para navegar rápidamente entre las vistas disponibles y realizar pruebas de conexión.

---

## 🛰 Configuración en OBS (Open Broadcaster Software)

Para integrar el overlay en tu transmisión, sigue estos pasos:

1. Crea una nueva fuente de tipo **Navegador** (Browser Source) en tu escena de OBS.
2. En el campo **URL**, ingresa la dirección del overlay (asegúrate de que el proyecto esté corriendo):
   `http://localhost:5173/overlay/game`
3. Ajusta el **Ancho** a `1920` y el **Alto** a `1080` (o la resolución de tu lienzo).
4. **Importante:** Marca la opción "Apagar fuente cuando no sea visible" para evitar que el socket siga conectado innecesariamente.
5. Si quieres capturar el audio del juego de forma independiente, marca "Controlar audio vía OBS".

---

## 🚀 Inicio Rápido

### 1. Instalación de dependencias
```bash
npm install
```

### 2. Configuración de Variables de Entorno
Asegúrate de configurar la URL del backend en tu archivo `.env` (si aplica) para que el socket pueda conectarse correctamente.

### 3. Ejecución en desarrollo
```bash
npm run dev
```
La aplicación estará disponible por defecto en `http://localhost:5173`.

---

## 🎨 Stack Tecnológico

- **Framework:** React con Vite.
- **Estilos:** Tailwind CSS y shadcn/ui.
- **Animaciones:** Framer Motion para las transiciones del overlay.
- **Comunicación:** Socket.io-client para la sincronización con el servidor NestJS.
- **Estado:** Zustand / React Query.

---

## 📜 Licencia
Este proyecto es de uso privado. Todos los derechos reservados.
