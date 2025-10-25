# 📁 Índice de Archivos del Proyecto

## 📱 Aplicación Principal

### `App.tsx`
Componente principal de la aplicación que contiene:
- Gestión del estado global
- Integración de todos los componentes
- Lógica de filtros y búsqueda
- Integración con SQLite
- Resumen estadístico

## 🧩 Componentes (`src/components/`)

### `DebtorCard.js`
Tarjeta individual para cada deudor con:
- Información del deudor (nombre, teléfono, saldo)
- Botones de acción (WhatsApp, Movimiento, Historial, Eliminar)
- Historial expandible/colapsable
- Colores dinámicos según saldo

### `AddDebtorModal.js`
Modal para agregar nuevos deudores:
- Formulario con validación
- Campos: nombre, teléfono, saldo inicial, mensaje WhatsApp
- Diseño responsive
- Ayudas contextuales

### `AddMovementModal.js`
Modal para registrar movimientos:
- Selección de tipo de movimiento
- Campo de monto con preview
- Descripción opcional
- Vista previa del nuevo saldo

### `FilterBar.js`
Barra de filtros y ordenamiento:
- Filtros: Todos, Me deben, Les debo
- Ordenamiento: Recientes, Mayor/Menor deuda, A-Z
- Diseño compacto

### `SearchBar.js`
Barra de búsqueda:
- Búsqueda por nombre o teléfono
- Botón para limpiar
- Diseño minimalista

## 💾 Servicios (`src/services/`)

### `DatabaseService.js`
Servicio de base de datos SQLite:
- Inicialización de BD
- CRUD de deudores
- CRUD de movimientos
- Cálculo de estadísticas
- Gestión de transacciones

## 📄 Configuración

### `package.json`
Dependencias del proyecto:
- react-native
- react-native-sqlite-storage
- react-native-vector-icons

### `android/app/build.gradle`
Configuración de Android:
- Plugins de React Native
- Configuración de vector icons
- Build variants

### `android/app/src/main/AndroidManifest.xml`
Manifest de Android:
- Permisos (Internet, Storage)
- Queries para WhatsApp
- Configuración de la aplicación

### `android/app/src/main/res/values/strings.xml`
Recursos de strings:
- Nombre de la aplicación: "Gestión de Deudas"

## 📚 Documentación

### `README.md`
Documentación completa:
- Características
- Requisitos
- Instalación
- Compilación
- Guía de uso
- Solución de problemas

### `COMPILAR.md`
Instrucciones rápidas de compilación:
- Modo desarrollo
- Compilar APK
- Comandos esenciales

### `RESUMEN.md`
Resumen visual de la aplicación:
- Funcionalidades implementadas
- Diseño y colores
- Estructura de BD
- Tecnologías
- Flujo de usuario

### `MEJORAS_FUTURAS.md`
Sugerencias de mejoras:
- Funcionalidades adicionales
- Mejoras técnicas
- UX/UI
- Integraciones
- Monetización

### `TROUBLESHOOTING.md`
Solución de problemas:
- Errores de compilación
- Problemas en la app
- Errores de TypeScript
- Performance
- Debug avanzado

## 📂 Estructura Completa

```
DebtManager/
│
├── 📱 Aplicación
│   ├── App.tsx                           # Componente principal
│   ├── index.js                          # Entry point
│   └── app.json                          # Configuración app
│
├── 📦 Código Fuente (src/)
│   ├── components/                       # Componentes UI
│   │   ├── DebtorCard.js
│   │   ├── AddDebtorModal.js
│   │   ├── AddMovementModal.js
│   │   ├── FilterBar.js
│   │   └── SearchBar.js
│   └── services/                         # Servicios
│       └── DatabaseService.js            # SQLite service
│
├── 🤖 Android
│   ├── android/app/build.gradle          # Build config
│   ├── android/app/src/main/
│   │   ├── AndroidManifest.xml           # Manifest
│   │   └── res/values/strings.xml        # Strings
│   └── android/local.properties          # SDK location
│
├── 🍎 iOS
│   └── ios/                              # Archivos iOS
│
├── 📚 Documentación
│   ├── README.md                         # Documentación principal
│   ├── COMPILAR.md                       # Guía de compilación
│   ├── RESUMEN.md                        # Resumen de features
│   ├── MEJORAS_FUTURAS.md                # Mejoras sugeridas
│   ├── TROUBLESHOOTING.md                # Solución problemas
│   └── INDICE.md                         # Este archivo
│
├── ⚙️ Configuración
│   ├── package.json                      # Dependencias NPM
│   ├── tsconfig.json                     # Config TypeScript
│   ├── babel.config.js                   # Config Babel
│   ├── metro.config.js                   # Config Metro
│   ├── jest.config.js                    # Config Jest
│   ├── .eslintrc.js                      # Config ESLint
│   └── .prettierrc.js                    # Config Prettier
│
└── 🧪 Tests
    └── __tests__/
        └── App.test.tsx                  # Tests básicos
```

## 🔑 Archivos Clave por Funcionalidad

### Para modificar la UI:
- `App.tsx` - Layout principal
- `src/components/*.js` - Componentes individuales

### Para modificar la BD:
- `src/services/DatabaseService.js` - Lógica de SQLite

### Para compilar:
- `android/app/build.gradle` - Config Android
- `COMPILAR.md` - Instrucciones

### Para configurar permisos:
- `android/app/src/main/AndroidManifest.xml`

### Para agregar dependencias:
- `package.json`

## 📊 Estadísticas del Proyecto

- **Total de archivos creados/modificados:** ~20
- **Componentes React:** 6
- **Servicios:** 1
- **Archivos de documentación:** 5
- **Líneas de código (aprox):** 2000+

## 🎯 Próximos Pasos

1. ✅ Compilar y probar la aplicación
2. ✅ Verificar que todas las funcionalidades trabajen
3. 🔄 Realizar ajustes según necesidades
4. 📱 Generar APK de producción
5. 🚀 Distribuir o usar

---

**Nota:** Este archivo sirve como referencia rápida para navegar el proyecto. Para información detallada sobre cada funcionalidad, consulta los archivos de documentación correspondientes.
