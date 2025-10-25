# 📱 Gestión de Deudas - Resumen de la Aplicación

## ✨ Funcionalidades Implementadas

### 1. **Gestión de Deudores**
- ➕ Agregar nuevos deudores con nombre, teléfono y saldo inicial
- 🗑️ Eliminar deudores (con confirmación)
- 📝 Mensaje personalizable de WhatsApp con variables {name} y {balance}

### 2. **Sistema de Colores Inteligente**
- 🟢 **Verde (#34C759)**: Cuando TE DEBEN dinero (saldo positivo)
- 🔴 **Rojo (#FF3B30)**: Cuando TÚ DEBES dinero (saldo negativo)
- 🔵 **Azul (#007AFF)**: Acciones principales

### 3. **Historial de Movimientos**
- 📊 Registro completo de todos los movimientos
- 📅 Fecha y hora automática
- 💰 4 tipos de movimientos:
  - "Me pagó" - Reduce deuda a tu favor
  - "Le presté" - Aumenta deuda a tu favor
  - "Le pagué" - Reduce tu deuda
  - "Me prestó" - Aumenta tu deuda
- 📝 Descripción opcional en cada movimiento
- 👁️ Historial expandible/colapsable por deudor

### 4. **Integración con WhatsApp**
- 📱 Botón directo para abrir chat
- ✉️ Mensaje personalizado automático
- 🔄 Reemplazo dinámico de variables

### 5. **Filtros y Búsqueda** (Como solicitaste)
- 🔍 **Búsqueda**: Por nombre o teléfono
- 🎯 **Filtros**:
  - Todos
  - Me deben (solo saldos positivos)
  - Les debo (solo saldos negativos)
- 📈 **Ordenamiento**:
  - Recientes (últimos actualizados)
  - Mayor deuda (de mayor a menor)
  - Menor deuda (de menor a mayor)
  - A-Z (alfabético)

### 6. **Resumen Estadístico**
- 📊 Total de deudores
- 💚 Total que te deben
- ❤️ Total que tú debes
- 💰 Balance neto (diferencia)

### 7. **Base de Datos SQLite**
- 💾 Almacenamiento local persistente
- 🔒 Datos seguros en el dispositivo
- ⚡ Operaciones rápidas
- 🔄 Sincronización automática

## 🎨 Diseño

### Paleta de Colores:
```
Fondo principal: #F8F8F8 (Gris claro)
Tarjetas: #FFFFFF (Blanco)
Texto principal: #1C1C1E (Negro)
Texto secundario: #8E8E93 (Gris)
Positivo: #34C759 (Verde)
Negativo: #FF3B30 (Rojo)
Acción: #007AFF (Azul)
```

### Componentes:
- ✅ DebtorCard: Tarjeta individual con toda la info
- ✅ AddDebtorModal: Modal para agregar deudores
- ✅ AddMovementModal: Modal para registrar movimientos
- ✅ FilterBar: Barra de filtros y ordenamiento
- ✅ SearchBar: Búsqueda rápida
- ✅ Header con resumen y botón de agregar

## 📂 Estructura de la Base de Datos

### Tabla: `debtors`
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- phone (TEXT)
- balance (REAL)
- whatsapp_message (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### Tabla: `movements`
```sql
- id (INTEGER PRIMARY KEY)
- debtor_id (INTEGER - FK)
- amount (REAL)
- type (TEXT)
- description (TEXT)
- created_at (DATETIME)
```

## 🔧 Tecnologías Utilizadas

- ⚛️ **React Native 0.82**
- 💾 **react-native-sqlite-storage** - Base de datos
- 🎨 **react-native-vector-icons** - Iconos
- 📱 **React Native Linking** - WhatsApp
- 💪 **TypeScript** - Tipado

## 📲 Flujo de Usuario

1. **Inicio** → Ver lista de deudores con resumen
2. **Buscar** → Usar barra de búsqueda
3. **Filtrar** → Aplicar filtros y ordenamiento
4. **Agregar deudor** → Botón "+" → Formulario
5. **Ver detalles** → Expandir historial
6. **Agregar movimiento** → Botón "Movimiento" → Seleccionar tipo → Ingresar monto
7. **Contactar** → Botón "WhatsApp" → Abre chat
8. **Eliminar** → Botón "Eliminar" → Confirmar

## ✅ Todas las características solicitadas:

✓ Pantalla única
✓ Agregar nombre, saldo, contacto
✓ Botón WhatsApp con mensaje personalizado
✓ Historial con fecha y hora
✓ SQLite como base de datos
✓ Colores verde/rojo según tipo de deuda
✓ Filtros y ordenamiento
✓ Búsqueda
✓ Confirmación al eliminar
✓ Resumen total
✓ Historial expandible
✓ Diseño profesional

## 🎯 Próximos pasos sugeridos (opcional):

- 📊 Gráficos de estadísticas
- 📅 Recordatorios de pago
- 📸 Adjuntar fotos de recibos
- 🌙 Modo oscuro
- ☁️ Backup en la nube
- 📧 Exportar reportes
- 🔐 PIN de seguridad

---

**¡La aplicación está lista para compilar y usar! 🚀**
