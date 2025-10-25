# 🚀 Instrucciones Rápidas de Compilación

## Para ejecutar en modo desarrollo (testing):

1. Abre una terminal y ejecuta:
```bash
cd "c:\Users\Adrian\Documents\React Native\Gestion de deudas\DebtManager"
npm start
```

2. Abre OTRA terminal y ejecuta:
```bash
cd "c:\Users\Adrian\Documents\React Native\Gestion de deudas\DebtManager"
npm run android
```

## Para compilar APK instalable (producción):

```bash
cd "c:\Users\Adrian\Documents\React Native\Gestion de deudas\DebtManager\android"
.\gradlew assembleRelease
```

El APK estará en:
```
android\app\build\outputs\apk\release\app-release.apk
```

## Nota importante:
- Asegúrate de tener un emulador Android corriendo o un dispositivo físico conectado
- La primera compilación puede tardar varios minutos
- Si hay errores, ejecuta: `cd android && .\gradlew clean` y vuelve a intentar
