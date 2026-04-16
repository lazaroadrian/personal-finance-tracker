import * as SQLite from 'expo-sqlite';

const database_name = 'DebtManager.db';

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async initDB() {
    try {
      if (this.db) {
        return this.db;
      }
      this.db = await SQLite.openDatabaseAsync(database_name);
      console.log('Database OPEN');
      await this.createTables();
      return this.db;
    } catch (error) {
      console.log('Error opening database: ', error);
      throw error;
    }
  }

  async getDB() {
    if (!this.db) {
      await this.initDB();
    }
    return this.db;
  }

  async closeDatabase() {
    if (this.db) {
      console.log('Closing database');
      await this.db.closeAsync();
      this.db = null;
      console.log('Database CLOSED');
    } else {
      console.log('Database was not OPEN');
    }
  }

  // Función auxiliar para obtener la fecha/hora en zona horaria de Cuba
  getCurrentDateTime() {
    return new Date().toLocaleString('en-US', { 
      timeZone: 'America/Havana',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6');
  }

  async createTables() {
    try {
      // createTables se llama solo desde initDB, donde this.db ya está asignado
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS debtors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          balance REAL DEFAULT 0,
          whatsapp_message TEXT DEFAULT 'Hola {name}, te contacto sobre el saldo pendiente de $balance.',
          created_at DATETIME,
          updated_at DATETIME
        );
      `);

      // Tabla de historial de movimientos
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          debtor_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          method TEXT DEFAULT 'Efectivo',
          description TEXT,
          created_at DATETIME,
          FOREIGN KEY (debtor_id) REFERENCES debtors (id) ON DELETE CASCADE
        );
      `);

      // Migración: agregar columna method si no existe
      try {
        await this.db.runAsync(`ALTER TABLE movements ADD COLUMN method TEXT DEFAULT 'Efectivo'`);
      } catch (e) {
        // La columna ya existe, ignorar
      }

      // Tabla de configuración
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);

      // Tabla de grupos de frascos
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS jar_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          color TEXT DEFAULT '#1A237E',
          icon TEXT DEFAULT 'flask-outline',
          created_at DATETIME,
          updated_at DATETIME
        );
      `);

      // Tabla de frascos
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS jars (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          percentage REAL DEFAULT 0,
          color TEXT DEFAULT '#007AFF',
          icon TEXT DEFAULT 'wallet-outline',
          balance REAL DEFAULT 0,
          goal REAL DEFAULT 0,
          created_at DATETIME,
          updated_at DATETIME
        );
      `);

      // Tabla de movimientos de frascos
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS jar_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          jar_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          created_at DATETIME,
          FOREIGN KEY (jar_id) REFERENCES jars (id) ON DELETE CASCADE
        );
      `);

      // Migración: agregar columna monthly_budget si no existe
      try {
        await this.db.runAsync(`ALTER TABLE jars ADD COLUMN monthly_budget REAL DEFAULT 0`);
      } catch (e) {
        // La columna ya existe, ignorar
      }

      // Migración: agregar columna category si no existe
      try {
        await this.db.runAsync(`ALTER TABLE jar_movements ADD COLUMN category TEXT DEFAULT ''`);
      } catch (e) {
        // La columna ya existe, ignorar
      }

      // Migración: agregar columna group_id a jars si no existe
      try {
        await this.db.runAsync(`ALTER TABLE jars ADD COLUMN group_id INTEGER DEFAULT NULL REFERENCES jar_groups(id)`);
      } catch (e) {
        // La columna ya existe, ignorar
      }

      // Migrar frascos existentes sin grupo al grupo "Predeterminado"
      await this.migrateOrphanJars();
      
      console.log('Tables created successfully');
    } catch (error) {
      console.log('Error creating tables: ', error);
      throw error;
    }
  }

  // ============ DEBTORS CRUD ============

  async addDebtor(name, phone, initialBalance = 0, whatsappMessage = null) {
    try {
      const db = await this.getDB();
      const defaultMessage = `Hola ${name}, te contacto sobre el saldo pendiente de $${initialBalance}.`;
      const message = whatsappMessage || defaultMessage;
      const now = this.getCurrentDateTime();

      const result = await db.runAsync(
        'INSERT INTO debtors (name, phone, balance, whatsapp_message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [name, phone, initialBalance, message, now, now]
      );
      
      const debtorId = result.lastInsertRowId;
      
      // Si hay un saldo inicial, crear el primer movimiento
      if (initialBalance !== 0) {
        const type = initialBalance > 0 ? 'Le presté' : 'Me prestó';
        await db.runAsync(
          'INSERT INTO movements (debtor_id, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?)',
          [debtorId, Math.abs(initialBalance), type, 'Saldo inicial', now]
        );
      }
      
      return result;
    } catch (error) {
      console.log('Error adding debtor: ', error);
      throw error;
    }
  }

  async getAllDebtors() {
    try {
      const db = await this.getDB();
      const debtors = await db.getAllAsync('SELECT * FROM debtors ORDER BY updated_at DESC');
      return debtors;
    } catch (error) {
      console.log('Error getting debtors: ', error);
      throw error;
    }
  }

  async getDebtorById(id) {
    try {
      const db = await this.getDB();
      const debtor = await db.getFirstAsync('SELECT * FROM debtors WHERE id = ?', [id]);
      return debtor;
    } catch (error) {
      console.log('Error getting debtor: ', error);
      throw error;
    }
  }

  async updateDebtor(id, name, phone, whatsappMessage) {
    try {
      const db = await this.getDB();
      const now = this.getCurrentDateTime();
      const result = await db.runAsync(
        'UPDATE debtors SET name = ?, phone = ?, whatsapp_message = ?, updated_at = ? WHERE id = ?',
        [name, phone, whatsappMessage, now, id]
      );
      return result;
    } catch (error) {
      console.log('Error updating debtor: ', error);
      throw error;
    }
  }

  async deleteDebtor(id) {
    try {
      const db = await this.getDB();
      // Primero eliminar todos los movimientos asociados
      await db.runAsync('DELETE FROM movements WHERE debtor_id = ?', [id]);
      // Luego eliminar el deudor
      const result = await db.runAsync('DELETE FROM debtors WHERE id = ?', [id]);
      return result;
    } catch (error) {
      console.log('Error deleting debtor: ', error);
      throw error;
    }
  }

  // ============ MOVEMENTS ============

  async addMovement(debtorId, amount, type, description = '', method = 'Efectivo') {
    try {
      const db = await this.getDB();
      const now = this.getCurrentDateTime();
      
      // Agregar el movimiento
      await db.runAsync(
        'INSERT INTO movements (debtor_id, amount, type, method, description, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [debtorId, amount, type, method, description, now]
      );

      // Actualizar el balance del deudor
      let balanceChange = 0;
      if (type === 'Le presté' || type === 'Le cobré más') {
        balanceChange = amount; // Aumenta lo que me deben
      } else if (type === 'Me pagó') {
        balanceChange = -amount; // Disminuye lo que me deben
      }
      // Tipos legacy (datos históricos)
      else if (type === 'Me prestó') {
        balanceChange = -amount;
      } else if (type === 'Le pagué') {
        balanceChange = amount;
      }

      const result = await db.runAsync(
        'UPDATE debtors SET balance = balance + ?, updated_at = ? WHERE id = ?',
        [balanceChange, now, debtorId]
      );
      
      return result;
    } catch (error) {
      console.log('Error adding movement: ', error);
      throw error;
    }
  }

  async getMovementsByDebtor(debtorId) {
    try {
      const db = await this.getDB();
      const movements = await db.getAllAsync(
        'SELECT * FROM movements WHERE debtor_id = ? ORDER BY created_at DESC',
        [debtorId]
      );
      return movements;
    } catch (error) {
      console.log('Error getting movements: ', error);
      throw error;
    }
  }

  async deleteMovement(movementId) {
    try {
      const db = await this.getDB();
      const movement = await db.getFirstAsync('SELECT * FROM movements WHERE id = ?', [movementId]);
      if (!movement) throw new Error('Movimiento no encontrado');

      // Verificar que fue creado hace menos de 20 minutos
      const createdAt = new Date(movement.created_at);
      const now = new Date();
      const diffMinutes = (now - createdAt) / (1000 * 60);
      if (diffMinutes > 20) {
        throw new Error('Solo puedes eliminar movimientos creados en los últimos 20 minutos');
      }

      // Revertir el balance del deudor
      let balanceRevert = 0;
      if (movement.type === 'Le presté' || movement.type === 'Le cobré más') {
        balanceRevert = -movement.amount;
      } else if (movement.type === 'Me pagó') {
        balanceRevert = movement.amount;
      } else if (movement.type === 'Me prestó') {
        balanceRevert = movement.amount;
      } else if (movement.type === 'Le pagué') {
        balanceRevert = -movement.amount;
      }

      const updateNow = this.getCurrentDateTime();
      await db.runAsync(
        'UPDATE debtors SET balance = balance + ?, updated_at = ? WHERE id = ?',
        [balanceRevert, updateNow, movement.debtor_id]
      );
      await db.runAsync('DELETE FROM movements WHERE id = ?', [movementId]);
      return true;
    } catch (error) {
      console.log('Error deleting movement: ', error);
      throw error;
    }
  }

  // ============ STATISTICS ============

  async getTotalStats() {
    try {
      const db = await this.getDB();
      const result = await db.getFirstAsync(`
        SELECT 
          SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as total_owed_to_me,
          SUM(CASE WHEN balance < 0 THEN balance ELSE 0 END) as total_i_owe,
          SUM(balance) as net_balance,
          COUNT(*) as total_debtors
        FROM debtors
      `);
      
      return result || {
        total_owed_to_me: 0,
        total_i_owe: 0,
        net_balance: 0,
        total_debtors: 0
      };
    } catch (error) {
      console.log('Error getting stats: ', error);
      throw error;
    }
  }

  async getMethodStats() {
    try {
      const db = await this.getDB();
      const allMovements = await db.getAllAsync(
        'SELECT amount, type, method FROM movements ORDER BY created_at ASC'
      );
      let cashIn = 0;
      let transferIn = 0;
      allMovements.forEach(m => {
        const amt = parseFloat(m.amount);
        const method = m.method || 'Efectivo';
        if (m.type === 'Me pagó') {
          if (method === 'Transferencia') transferIn += amt;
          else cashIn += amt;
        }
        if (m.type === 'Le pagué') {
          if (method === 'Transferencia') {
            if (transferIn >= amt) { transferIn -= amt; }
            else { const remainder = amt - transferIn; transferIn = 0; cashIn = Math.max(0, cashIn - remainder); }
          } else {
            if (cashIn >= amt) { cashIn -= amt; }
            else { const remainder = amt - cashIn; cashIn = 0; transferIn = Math.max(0, transferIn - remainder); }
          }
        }
      });
      return { cash_balance: cashIn, transfer_balance: transferIn };
    } catch (error) {
      console.log('Error getting method stats: ', error);
      return { cash_balance: 0, transfer_balance: 0 };
    }
  }


  // ============ SETTINGS ============

  async getSetting(key, defaultValue = null) {
    try {
      const db = await this.getDB();
      const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key]);
      return row ? row.value : defaultValue;
    } catch (error) {
      console.log('Error getting setting: ', error);
      return defaultValue;
    }
  }

  async setSetting(key, value) {
    try {
      const db = await this.getDB();
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
      );
    } catch (error) {
      console.log('Error saving setting: ', error);
    }
  }

  // ============ BACKUP / RESTORE ============

  async exportData() {
    try {
      const db = await this.getDB();
      const debtors = await db.getAllAsync('SELECT * FROM debtors');
      const movements = await db.getAllAsync('SELECT * FROM movements ORDER BY created_at ASC');
      const jar_groups = await db.getAllAsync('SELECT * FROM jar_groups ORDER BY created_at ASC');
      const jars = await db.getAllAsync('SELECT * FROM jars ORDER BY created_at ASC');
      const jar_movements = await db.getAllAsync('SELECT * FROM jar_movements ORDER BY created_at ASC');
      
      return {
        version: 2,
        exportDate: this.getCurrentDateTime(),
        app: 'Gestor de Cuentas',
        debtors,
        movements,
        jar_groups,
        jars,
        jar_movements,
      };
    } catch (error) {
      console.log('Error exporting data: ', error);
      throw error;
    }
  }

  async importData(data) {
    try {
      const db = await this.getDB();
      if (!data || !data.debtors || !data.movements) {
        throw new Error('Formato de backup inválido');
      }

      // Eliminar datos actuales
      await db.execAsync('DELETE FROM jar_movements');
      await db.execAsync('DELETE FROM jars');
      await db.execAsync('DELETE FROM jar_groups');
      await db.execAsync('DELETE FROM movements');
      await db.execAsync('DELETE FROM debtors');

      // Importar deudores
      for (const debtor of data.debtors) {
        await db.runAsync(
          'INSERT INTO debtors (id, name, phone, balance, whatsapp_message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [debtor.id, debtor.name, debtor.phone, debtor.balance, debtor.whatsapp_message, debtor.created_at, debtor.updated_at]
        );
      }

      // Importar movimientos
      for (const movement of data.movements) {
        await db.runAsync(
          'INSERT INTO movements (id, debtor_id, amount, type, method, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [movement.id, movement.debtor_id, movement.amount, movement.type, movement.method || 'Efectivo', movement.description, movement.created_at]
        );
      }

      // Importar grupos de frascos (si existen en el backup)
      if (data.jar_groups && data.jar_groups.length > 0) {
        for (const group of data.jar_groups) {
          await db.runAsync(
            'INSERT INTO jar_groups (id, name, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [group.id, group.name, group.color, group.icon, group.created_at, group.updated_at]
          );
        }
      }

      // Importar frascos (si existen en el backup)
      if (data.jars && data.jars.length > 0) {
        for (const jar of data.jars) {
          await db.runAsync(
            'INSERT INTO jars (id, name, percentage, color, icon, balance, goal, monthly_budget, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [jar.id, jar.name, jar.percentage, jar.color, jar.icon, jar.balance, jar.goal || 0, jar.monthly_budget || 0, jar.group_id, jar.created_at, jar.updated_at]
          );
        }
      }

      // Importar movimientos de frascos (si existen en el backup)
      if (data.jar_movements && data.jar_movements.length > 0) {
        for (const jm of data.jar_movements) {
          await db.runAsync(
            'INSERT INTO jar_movements (id, jar_id, amount, type, description, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [jm.id, jm.jar_id, jm.amount, jm.type, jm.description || '', jm.category || '', jm.created_at]
          );
        }
      }

      return true;
    } catch (error) {
      console.log('Error importing data: ', error);
      throw error;
    }
  }

  // ============ JAR GROUPS ============

  async migrateOrphanJars() {
    try {
      const db = await this.getDB();
      const orphans = await db.getFirstAsync('SELECT COUNT(*) as total FROM jars WHERE group_id IS NULL');
      if (orphans.total > 0) {
        // Buscar o crear grupo "Predeterminado"
        let group = await db.getFirstAsync("SELECT id FROM jar_groups WHERE name = 'Predeterminado'");
        if (!group) {
          const now = this.getCurrentDateTime();
          const result = await db.runAsync(
            'INSERT INTO jar_groups (name, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            ['Predeterminado', '#1A237E', 'flask-outline', now, now]
          );
          group = { id: result.lastInsertRowId };
        }
        await db.runAsync('UPDATE jars SET group_id = ? WHERE group_id IS NULL', [group.id]);
      }
    } catch (error) {
      console.log('Error migrating orphan jars: ', error);
    }
  }

  async addJarGroup(name, color = '#1A237E', icon = 'flask-outline') {
    try {
      const db = await this.getDB();
      const now = this.getCurrentDateTime();
      const result = await db.runAsync(
        'INSERT INTO jar_groups (name, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [name, color, icon, now, now]
      );
      return result;
    } catch (error) {
      console.log('Error adding jar group: ', error);
      throw error;
    }
  }

  async getAllJarGroups() {
    try {
      const db = await this.getDB();
      const groups = await db.getAllAsync('SELECT * FROM jar_groups ORDER BY created_at ASC');
      // Agregar conteo de frascos y balance total a cada grupo
      for (const group of groups) {
        const stats = await db.getFirstAsync(
          'SELECT COUNT(*) as jar_count, COALESCE(SUM(balance), 0) as total_balance FROM jars WHERE group_id = ?',
          [group.id]
        );
        group.jar_count = stats.jar_count;
        group.total_balance = stats.total_balance;
      }
      return groups;
    } catch (error) {
      console.log('Error getting jar groups: ', error);
      throw error;
    }
  }

  async getJarGroupById(id) {
    try {
      const db = await this.getDB();
      return await db.getFirstAsync('SELECT * FROM jar_groups WHERE id = ?', [id]);
    } catch (error) {
      console.log('Error getting jar group: ', error);
      throw error;
    }
  }

  async updateJarGroup(id, name, color, icon) {
    try {
      const db = await this.getDB();
      const now = this.getCurrentDateTime();
      await db.runAsync(
        'UPDATE jar_groups SET name = ?, color = ?, icon = ?, updated_at = ? WHERE id = ?',
        [name, color, icon, now, id]
      );
    } catch (error) {
      console.log('Error updating jar group: ', error);
      throw error;
    }
  }

  async deleteJarGroup(id) {
    try {
      const db = await this.getDB();
      // Eliminar movimientos de todos los frascos del grupo
      await db.runAsync(
        'DELETE FROM jar_movements WHERE jar_id IN (SELECT id FROM jars WHERE group_id = ?)',
        [id]
      );
      // Eliminar frascos del grupo
      await db.runAsync('DELETE FROM jars WHERE group_id = ?', [id]);
      // Eliminar el grupo
      await db.runAsync('DELETE FROM jar_groups WHERE id = ?', [id]);
    } catch (error) {
      console.log('Error deleting jar group: ', error);
      throw error;
    }
  }

  async getJarsByGroup(groupId) {
    try {
      const db = await this.getDB();
      return await db.getAllAsync(
        'SELECT * FROM jars WHERE group_id = ? ORDER BY created_at ASC',
        [groupId]
      );
    } catch (error) {
      console.log('Error getting jars by group: ', error);
      throw error;
    }
  }

  // ============ JARS (FRASCOS) ============

  async seedDefaultJar() {
    try {
      const db = await this.getDB();
      const count = await db.getFirstAsync('SELECT COUNT(*) as total FROM jars');
      if (count.total === 0) {
        // Crear grupo predeterminado
        let group = await db.getFirstAsync("SELECT id FROM jar_groups WHERE name = 'Predeterminado'");
        if (!group) {
          const now = this.getCurrentDateTime();
          const result = await db.runAsync(
            'INSERT INTO jar_groups (name, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            ['Predeterminado', '#1A237E', 'flask-outline', now, now]
          );
          group = { id: result.lastInsertRowId };
        }
        const now = this.getCurrentDateTime();
        await db.runAsync(
          'INSERT INTO jars (name, percentage, color, icon, balance, goal, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          ['Necesidades', 55, '#007AFF', 'home-outline', 0, 0, group.id, now, now]
        );
      }
    } catch (error) {
      console.log('Error seeding default jar: ', error);
    }
  }

  async addJar(name, percentage = 0, color = '#007AFF', icon = 'wallet-outline', goal = 0, groupId = null) {
    try {
      const db = await this.getDB();
      const now = this.getCurrentDateTime();
      const result = await db.runAsync(
        'INSERT INTO jars (name, percentage, color, icon, balance, goal, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, percentage, color, icon, 0, goal, groupId, now, now]
      );
      return result;
    } catch (error) {
      console.log('Error adding jar: ', error);
      throw error;
    }
  }

  async getAllJars() {
    try {
      const db = await this.getDB();
      const jars = await db.getAllAsync('SELECT * FROM jars ORDER BY created_at ASC');
      return jars;
    } catch (error) {
      console.log('Error getting jars: ', error);
      throw error;
    }
  }

  async getJarById(id) {
    try {
      const db = await this.getDB();
      const jar = await db.getFirstAsync('SELECT * FROM jars WHERE id = ?', [id]);
      return jar;
    } catch (error) {
      console.log('Error getting jar: ', error);
      throw error;
    }
  }

  async updateJar(id, name, percentage, color, icon, goal, monthlyBudget) {
    try {
      const db = await this.getDB();
      const now = this.getCurrentDateTime();
      const result = await db.runAsync(
        'UPDATE jars SET name = ?, percentage = ?, color = ?, icon = ?, goal = ?, monthly_budget = ?, updated_at = ? WHERE id = ?',
        [name, percentage, color, icon, goal, monthlyBudget || 0, now, id]
      );
      return result;
    } catch (error) {
      console.log('Error updating jar: ', error);
      throw error;
    }
  }

  async deleteJar(id) {
    try {
      const db = await this.getDB();
      await db.runAsync('DELETE FROM jar_movements WHERE jar_id = ?', [id]);
      const result = await db.runAsync('DELETE FROM jars WHERE id = ?', [id]);
      return result;
    } catch (error) {
      console.log('Error deleting jar: ', error);
      throw error;
    }
  }

  async addJarMovement(jarId, amount, type, description = '', category = '') {
    try {
      const db = await this.getDB();
      const now = this.getCurrentDateTime();

      // Verificar que no caiga en negativo si es gasto
      if (type === 'Gasto') {
        const jar = await this.getJarById(jarId);
        if (jar.balance < amount) {
          throw new Error(`Fondos insuficientes. Saldo disponible: $${jar.balance.toFixed(2)}`);
        }
      }

      await db.runAsync(
        'INSERT INTO jar_movements (jar_id, amount, type, description, category, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [jarId, amount, type, description, category, now]
      );

      const balanceChange = type === 'Ingreso' ? amount : -amount;
      await db.runAsync(
        'UPDATE jars SET balance = balance + ?, updated_at = ? WHERE id = ?',
        [balanceChange, now, jarId]
      );

      return await this.getJarById(jarId);
    } catch (error) {
      console.log('Error adding jar movement: ', error);
      throw error;
    }
  }

  async getJarMovements(jarId) {
    try {
      const db = await this.getDB();
      const movements = await db.getAllAsync(
        'SELECT * FROM jar_movements WHERE jar_id = ? ORDER BY created_at DESC',
        [jarId]
      );
      return movements;
    } catch (error) {
      console.log('Error getting jar movements: ', error);
      throw error;
    }
  }

  async setJarGoal(jarId, goal) {
    try {
      const db = await this.getDB();
      const now = this.getCurrentDateTime();
      await db.runAsync(
        'UPDATE jars SET goal = ?, updated_at = ? WHERE id = ?',
        [goal, now, jarId]
      );
      return await this.getJarById(jarId);
    } catch (error) {
      console.log('Error setting jar goal: ', error);
      throw error;
    }
  }

  async distributeIncome(distributions) {
    try {
      const now = this.getCurrentDateTime();
      const db = await this.getDB();
      for (const { jarId, amount } of distributions) {
        if (amount <= 0) continue;
        await db.runAsync(
          'INSERT INTO jar_movements (jar_id, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?)',
          [jarId, amount, 'Ingreso', 'Distribución automática', now]
        );
        await db.runAsync(
          'UPDATE jars SET balance = balance + ?, updated_at = ? WHERE id = ?',
          [amount, now, jarId]
        );
      }
      return true;
    } catch (error) {
      console.log('Error distributing income: ', error);
      throw error;
    }
  }

  async transferBetweenJars(fromJarId, toJarId, amount, description = '') {
    try {
      const db = await this.getDB();
      const fromJar = await this.getJarById(fromJarId);
      if (fromJar.balance < amount) {
        throw new Error(`Fondos insuficientes en "${fromJar.name}". Saldo: $${fromJar.balance.toFixed(2)}`);
      }
      const toJar = await this.getJarById(toJarId);
      const now = this.getCurrentDateTime();
      const descFrom = description || `Transferencia a ${toJar.name}`;
      const descTo = description || `Transferencia de ${fromJar.name}`;

      await db.runAsync(
        'INSERT INTO jar_movements (jar_id, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?)',
        [fromJarId, amount, 'Gasto', descFrom, now]
      );
      await db.runAsync(
        'UPDATE jars SET balance = balance - ?, updated_at = ? WHERE id = ?',
        [amount, now, fromJarId]
      );

      await db.runAsync(
        'INSERT INTO jar_movements (jar_id, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?)',
        [toJarId, amount, 'Ingreso', descTo, now]
      );
      await db.runAsync(
        'UPDATE jars SET balance = balance + ?, updated_at = ? WHERE id = ?',
        [amount, now, toJarId]
      );

      return true;
    } catch (error) {
      console.log('Error transferring between jars: ', error);
      throw error;
    }
  }

  async getAllJarMovements() {
    try {
      const db = await this.getDB();
      const movements = await db.getAllAsync(`
        SELECT jm.*, j.name as jar_name, j.color as jar_color, j.icon as jar_icon
        FROM jar_movements jm
        JOIN jars j ON jm.jar_id = j.id
        ORDER BY jm.created_at DESC
      `);
      return movements;
    } catch (error) {
      console.log('Error getting all jar movements: ', error);
      throw error;
    }
  }

  async getMonthlySpending(jarId) {
    try {
      const db = await this.getDB();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const startOfMonth = `${year}-${month}-01 00:00:00`;
      const result = await db.getFirstAsync(
        `SELECT COALESCE(SUM(amount), 0) as total FROM jar_movements WHERE jar_id = ? AND type = 'Gasto' AND created_at >= ?`,
        [jarId, startOfMonth]
      );
      return result?.total || 0;
    } catch (error) {
      console.log('Error getting monthly spending: ', error);
      return 0;
    }
  }

  async setJarBudget(jarId, budget) {
    try {
      const db = await this.getDB();
      const now = this.getCurrentDateTime();
      await db.runAsync(
        'UPDATE jars SET monthly_budget = ?, updated_at = ? WHERE id = ?',
        [budget, now, jarId]
      );
      return await this.getJarById(jarId);
    } catch (error) {
      console.log('Error setting jar budget: ', error);
      throw error;
    }
  }

  async getJarsReportData() {
    try {
      const db = await this.getDB();
      const jars = await db.getAllAsync('SELECT * FROM jars ORDER BY created_at ASC');
      const movements = await db.getAllAsync(`
        SELECT jm.*, j.name as jar_name
        FROM jar_movements jm
        JOIN jars j ON jm.jar_id = j.id
        ORDER BY jm.created_at DESC
      `);
      return { jars, movements };
    } catch (error) {
      console.log('Error getting jars report data: ', error);
      throw error;
    }
  }

  async getJarBalanceHistory(jarId, days = 30) {
    try {
      const db = await this.getDB();
      const movements = await db.getAllAsync(
        `SELECT amount, type, created_at FROM jar_movements WHERE jar_id = ? ORDER BY created_at ASC`,
        [jarId]
      );
      return movements;
    } catch (error) {
      console.log('Error getting jar balance history: ', error);
      return [];
    }
  }

  async getAllJarsBalanceHistory() {
    try {
      const db = await this.getDB();
      const jars = await db.getAllAsync('SELECT id, name, color, icon FROM jars ORDER BY created_at ASC');
      const result = [];
      for (const jar of jars) {
        const movements = await db.getAllAsync(
          `SELECT amount, type, created_at FROM jar_movements WHERE jar_id = ? ORDER BY created_at ASC`,
          [jar.id]
        );
        result.push({ ...jar, movements });
      }
      return result;
    } catch (error) {
      console.log('Error getting all jars balance history: ', error);
      return [];
    }
  }

  async getCategoryStats(jarId = null) {
    try {
      const db = await this.getDB();
      let query = `SELECT category, SUM(amount) as total, COUNT(*) as count FROM jar_movements WHERE type = 'Gasto' AND category != ''`;
      const params = [];
      if (jarId) {
        query += ' AND jar_id = ?';
        params.push(jarId);
      }
      query += ' GROUP BY category ORDER BY total DESC';
      return await db.getAllAsync(query, params);
    } catch (error) {
      console.log('Error getting category stats: ', error);
      return [];
    }
  }

  async seedSixJarsTemplate(groupId = null) {
    try {
      const db = await this.getDB();
      const now = this.getCurrentDateTime();
      
      // Si no se pasa groupId, crear/obtener grupo "Predeterminado"
      let targetGroupId = groupId;
      if (!targetGroupId) {
        let group = await db.getFirstAsync("SELECT id FROM jar_groups WHERE name = 'Predeterminado'");
        if (!group) {
          const result = await db.runAsync(
            'INSERT INTO jar_groups (name, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            ['Predeterminado', '#1A237E', 'flask-outline', now, now]
          );
          targetGroupId = result.lastInsertRowId;
        } else {
          targetGroupId = group.id;
        }
      }

      const template = [
        { name: 'Necesidades', percentage: 55, color: '#007AFF', icon: 'home-outline' },
        { name: 'Libertad Financiera', percentage: 10, color: '#34C759', icon: 'trending-up-outline' },
        { name: 'Educación', percentage: 10, color: '#5856D6', icon: 'book-outline' },
        { name: 'Diversión', percentage: 10, color: '#FF9500', icon: 'game-controller-outline' },
        { name: 'Ahorro Largo Plazo', percentage: 10, color: '#30B0C7', icon: 'shield-checkmark-outline' },
        { name: 'Donaciones', percentage: 5, color: '#FF2D55', icon: 'heart-outline' },
      ];
      for (const jar of template) {
        // Evitar duplicados: verificar si ya existe un frasco con el mismo nombre en el grupo
        const existing = await db.getFirstAsync(
          'SELECT id FROM jars WHERE name = ? AND group_id = ?',
          [jar.name, targetGroupId]
        );
        if (existing) continue;
        await db.runAsync(
          'INSERT INTO jars (name, percentage, color, icon, balance, goal, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [jar.name, jar.percentage, jar.color, jar.icon, 0, 0, targetGroupId, now, now]
        );
      }
      return true;
    } catch (error) {
      console.log('Error seeding 6 jars template: ', error);
      throw error;
    }
  }
}

export default new DatabaseService();
