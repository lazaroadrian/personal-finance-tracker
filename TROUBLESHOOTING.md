# 🔧 Solución de Problemas Comunes

## 🚨 Problemas durante la Compilación

### Error: "SDK location not found"

**Solución:**
1. Crea o edita el archivo `android/local.properties`
2. Agrega la ruta de tu Android SDK:
   ```
   sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
   ```

### Error: "JAVA_HOME not set"

**Solución:**
1. Instala JDK 17
2. Configura variable de entorno:
   ```powershell
   [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-17', 'Machine')
   ```

### Error: "Gradle build failed"

**Solución:**
```bash
cd android
.\gradlew clean
cd ..
npm run android
```

### Error: "Unable to load script"

**Solución:**
```bash
npm start -- --reset-cache
```

---

## 📱 Problemas en la Aplicación

### No se pueden agregar deudores

**Causa:** Problema con SQLite
**Solución:**
1. Desinstala la app
2. Limpia la caché: `npm start -- --reset-cache`
3. Vuelve a instalar: `npm run android`

### WhatsApp no abre

**Causa:** WhatsApp no instalado o permisos
**Solución:**
1. Verifica que WhatsApp esté instalado
2. En Android 11+, asegúrate que el `<queries>` esté en `AndroidManifest.xml`
3. Reinstala la app

### Los datos no se guardan

**Causa:** Permisos de almacenamiento
**Solución:**
1. Verifica permisos en `AndroidManifest.xml`
2. En la app, ve a Configuración > Aplicaciones > Gestión de Deudas > Permisos
3. Otorga permisos de almacenamiento

### La búsqueda no funciona

**Causa:** Error de tipado
**Solución:** Ya está implementado correctamente, si persiste:
```bash
npm run android -- --reset-cache
```

---

## 🐛 Errores de TypeScript

### "Implicit any type"

**Solución:** Ya instalado `@types/react-native-vector-icons`
Si persiste:
```bash
npm install --save-dev @types/react-native-vector-icons
```

### Errores en App.tsx

**Causa:** TypeScript estricto
**Solución:** Los warnings no afectan la funcionalidad. La app compila y funciona correctamente.

---

## ⚡ Problemas de Performance

### La app va lenta

**Solución:**
1. Limpia build:
   ```bash
   cd android
   .\gradlew clean
   ```
2. Elimina node_modules:
   ```bash
   rm -rf node_modules
   npm install
   ```

### El scroll está trabado

**Causa:** Demasiados datos
**Solución:** 
- Ya implementado con FlatList (virtualización)
- Si persiste, limita el número de movimientos visibles

---

## 📦 Problemas con Dependencias

### "Module not found: react-native-vector-icons"

**Solución:**
```bash
npm install react-native-vector-icons
cd android
.\gradlew clean
cd ..
npm run android
```

### "SQLite not found"

**Solución:**
```bash
npm install react-native-sqlite-storage
cd android
.\gradlew clean
cd ..
npm run android
```

---

## 🔄 Problemas con Metro Bundler

### Puerto ocupado

**Solución:**
```bash
# Matar proceso en puerto 8081
npx react-native start --reset-cache --port 8082
```

### "Cannot connect to Metro"

**Solución:**
1. Cierra Metro
2. Ejecuta:
   ```bash
   npm start -- --reset-cache
   ```
3. En otra terminal:
   ```bash
   npm run android
   ```

---

## 📲 Problemas con el Emulador

### Emulador no inicia

**Solución:**
1. Abre Android Studio
2. AVD Manager > Create Virtual Device
3. Selecciona un dispositivo (ej: Pixel 5)
4. Descarga imagen del sistema
5. Crea el emulador

### "No devices found"

**Solución:**
```bash
# Reinicia adb
adb kill-server
adb start-server
adb devices
```

### Emulador muy lento

**Solución:**
1. En AVD Manager, edita el emulador
2. Aumenta RAM a 2048 MB
3. Habilita "Hardware - GLES 2.0"
4. Usa imagen x86_64 (más rápida)

---

## 🔐 Problemas de Permisos

### "Permission denied" al compilar

**Solución (Windows):**
```powershell
cd android
icacls gradlew /grant Everyone:F
.\gradlew clean
```

---

## 📝 Problemas con la Base de Datos

### Datos corruptos

**Solución:**
1. Desinstala la app
2. Borra datos:
   ```bash
   adb shell pm clear com.debtmanager
   ```
3. Reinstala

### Migraciones de BD

Si actualizas el esquema:
```javascript
// En DatabaseService.js
const database_version = '2.0'; // Incrementa versión
```

---

## 🎨 Problemas de UI

### Iconos no se ven

**Solución:**
1. Verifica que `fonts.gradle` esté aplicado
2. Limpia build:
   ```bash
   cd android
   .\gradlew clean
   ```

### Colores incorrectos

**Causa:** Caché
**Solución:**
```bash
npm start -- --reset-cache
```

---

## 🔍 Debug Avanzado

### Ver logs de Android

```bash
adb logcat | findstr "ReactNativeJS"
```

### Ver errores de SQLite

```bash
adb logcat | findstr "SQLite"
```

### Inspeccionar base de datos

```bash
adb shell
run-as com.debtmanager
cd databases
sqlite3 DebtManager.db
.tables
SELECT * FROM debtors;
```

---

## 📞 Contacto y Ayuda

Si ninguna de estas soluciones funciona:

1. **Revisa los logs completos:**
   ```bash
   adb logcat > log.txt
   ```

2. **Verifica versiones:**
   ```bash
   node --version  # Debe ser 18+
   npm --version
   java -version   # Debe ser 17
   ```

3. **Reinstala desde cero:**
   ```bash
   rm -rf node_modules
   rm -rf android/build
   rm -rf android/app/build
   npm install
   cd android
   .\gradlew clean
   cd ..
   npm run android
   ```

---

**Recuerda:** La mayoría de problemas se resuelven con:
1. `npm start -- --reset-cache`
2. `cd android && .\gradlew clean`
3. Reinstalar la app

¡Buena suerte! 🍀
