# Gestión de Deudas - React Native App

Aplicación móvil para gestionar deudas y préstamos de manera sencilla.

## 📱 Características

- ✅ **Gestión de deudores**: Agrega personas con nombre, teléfono y saldo inicial
- ✅ **Código de colores**: Verde para deudas a tu favor, rojo para deudas que tú debes
- ✅ **Historial de movimientos**: Registro automático de todos los movimientos con fecha y hora
- ✅ **Integración WhatsApp**: Envía mensajes personalizados directamente desde la app
- ✅ **Filtros y búsqueda**: Filtra por tipo de deuda y ordena por diferentes criterios
- ✅ **Resumen estadístico**: Vista rápida del total que te deben y lo que debes
- ✅ **Base de datos SQLite**: Todos los datos se guardan localmente

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- **Android Studio** con SDK de Android
- **JDK** (Java Development Kit 17)
- Un dispositivo Android físico o emulador configurado

## 🚀 Instalación

1. **Navega al directorio del proyecto:**
   ```bash
   cd "c:\Users\Adrian\Documents\React Native\Gestion de deudas\DebtManager"
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

## 📲 Compilar para Android

### Ejecutar en modo desarrollo:

1. **Inicia el servidor Metro:**
   ```bash
   npm start
   ```

2. **En otra terminal, ejecuta la app en Android:**
   ```bash
   npm run android
   ```
   O con React Native CLI:
   ```bash
   npx react-native run-android
   ```

### Compilar APK de Producción:

1. **Genera el APK de release:**
   ```bash
   cd android
   .\gradlew assembleRelease
   ```

2. **Encuentra el APK en:**
   ```
   android\app\build\outputs\apk\release\app-release.apk
   ```

### Compilar AAB para Google Play Store:

```bash
cd android
.\gradlew bundleRelease
```

El archivo AAB estará en:
```
android\app\build\outputs\bundle\release\app-release.aab
```

## 📖 Guía de Uso

### Agregar un deudor:
1. Toca el botón "+" en la esquina superior derecha
2. Ingresa nombre, teléfono y saldo inicial
3. Personaliza el mensaje de WhatsApp (opcional)
4. Guarda

### Agregar un movimiento:
1. En la tarjeta del deudor, toca "Movimiento"
2. Selecciona el tipo: "Me pagó", "Le presté", "Le pagué", "Me prestó"
3. Ingresa el monto
4. Agrega una descripción (opcional)
5. Guarda

### Ver historial:
- Toca "Historial" en la tarjeta del deudor para expandir/contraer el historial completo

### Enviar WhatsApp:
- Toca "WhatsApp" para abrir un chat con el mensaje personalizado

### Filtrar y ordenar:
- Usa los botones de filtro: "Todos", "Me deben", "Les debo"
- Ordena por: "Recientes", "Mayor deuda", "Menor deuda", "A-Z"
- Usa la barra de búsqueda para encontrar por nombre o teléfono

## 🎨 Colores y Diseño

- **Verde (#34C759)**: Dinero que te deben (saldo positivo)
- **Rojo (#FF3B30)**: Dinero que tú debes (saldo negativo)
- **Azul (#007AFF)**: Botones de acción principales
- Diseño limpio y moderno con estilo iOS-like

## 📂 Estructura del Proyecto

```
DebtManager/
├── src/
│   ├── services/
│   │   └── DatabaseService.js    # Servicio SQLite
│   └── components/
│       ├── DebtorCard.js         # Tarjeta de deudor
│       ├── AddDebtorModal.js     # Modal agregar deudor
│       ├── AddMovementModal.js   # Modal agregar movimiento
│       ├── FilterBar.js          # Barra de filtros
│       └── SearchBar.js          # Barra de búsqueda
├── App.tsx                        # Componente principal
├── android/                       # Archivos Android
└── ios/                          # Archivos iOS (si aplica)
```

## 🔧 Configuración de la Base de Datos

La aplicación usa SQLite para almacenar:
- **Tabla `debtors`**: Información de deudores (id, nombre, teléfono, saldo, mensaje WhatsApp)
- **Tabla `movements`**: Historial de movimientos (id, debtor_id, monto, tipo, descripción, fecha)

Los datos persisten localmente en el dispositivo.

## 🐛 Solución de Problemas

### Error: "WhatsApp no está instalado"
- Asegúrate de tener WhatsApp instalado en el dispositivo

### Error al compilar
- Limpia el build de Gradle:
  ```bash
  cd android
  .\gradlew clean
  ```

### Metro Bundler no inicia
- Limpia caché:
  ```bash
  npm start -- --reset-cache
  ```

## 📝 Notas Importantes

- Los permisos de almacenamiento están configurados para Android 11+
- La app funciona completamente offline
- Los datos se guardan automáticamente en SQLite
- Compatible con Android 6.0 (API 23) o superior

## 👨‍💻 Desarrollo

Para hacer cambios en la app:

1. Modifica los archivos en `src/`
2. Los cambios se reflejarán automáticamente con Hot Reload
3. Para cambios en código nativo, recompila con `npm run android`

## 📄 Licencia

Este proyecto es de código abierto para uso personal.

---

**¿Necesitas ayuda?** Revisa la documentación de React Native en: https://reactnative.dev

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
