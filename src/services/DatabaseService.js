import * as SQLite from 'expo-sqlite';

const database_name = 'DebtManager.db';

class DatabaseService {
  async initDB() {
    try {
      this.db = await SQLite.openDatabaseAsync(database_name);
      console.log('Database OPEN');
      await this.createTables();
      return this.db;
    } catch (error) {
      console.log('Error opening database: ', error);
      throw error;
    }
  }

  async closeDatabase() {
    if (this.db) {
      console.log('Closing database');
      await this.db.closeAsync();
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
      // Tabla de deudores
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
          description TEXT,
          created_at DATETIME,
          FOREIGN KEY (debtor_id) REFERENCES debtors (id) ON DELETE CASCADE
        );
      `);
      
      console.log('Tables created successfully');
    } catch (error) {
      console.log('Error creating tables: ', error);
      throw error;
    }
  }

  // ============ DEBTORS CRUD ============

  async addDebtor(name, phone, initialBalance = 0, whatsappMessage = null) {
    try {
      const defaultMessage = `Hola ${name}, te contacto sobre el saldo pendiente de $${initialBalance}.`;
      const message = whatsappMessage || defaultMessage;
      const now = this.getCurrentDateTime();

      const result = await this.db.runAsync(
        'INSERT INTO debtors (name, phone, balance, whatsapp_message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [name, phone, initialBalance, message, now, now]
      );
      
      const debtorId = result.lastInsertRowId;
      
      // Si hay un saldo inicial, crear el primer movimiento
      if (initialBalance !== 0) {
        const type = initialBalance > 0 ? 'Le presté' : 'Me prestó';
        await this.db.runAsync(
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
      const debtors = await this.db.getAllAsync('SELECT * FROM debtors ORDER BY updated_at DESC');
      return debtors;
    } catch (error) {
      console.log('Error getting debtors: ', error);
      throw error;
    }
  }

  async getDebtorById(id) {
    try {
      const debtor = await this.db.getFirstAsync('SELECT * FROM debtors WHERE id = ?', [id]);
      return debtor;
    } catch (error) {
      console.log('Error getting debtor: ', error);
      throw error;
    }
  }

  async updateDebtor(id, name, phone, whatsappMessage) {
    try {
      const now = this.getCurrentDateTime();
      const result = await this.db.runAsync(
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
      // Primero eliminar todos los movimientos asociados
      await this.db.runAsync('DELETE FROM movements WHERE debtor_id = ?', [id]);
      // Luego eliminar el deudor
      const result = await this.db.runAsync('DELETE FROM debtors WHERE id = ?', [id]);
      return result;
    } catch (error) {
      console.log('Error deleting debtor: ', error);
      throw error;
    }
  }

  // ============ MOVEMENTS ============

  async addMovement(debtorId, amount, type, description = '') {
    try {
      const now = this.getCurrentDateTime();
      
      // Agregar el movimiento
      await this.db.runAsync(
        'INSERT INTO movements (debtor_id, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?)',
        [debtorId, amount, type, description, now]
      );

      // Actualizar el balance del deudor
      let balanceChange = 0;
      if (type === 'Le presté' || type === 'Le cobré más') {
        balanceChange = amount; // Aumenta lo que me deben
      } else if (type === 'Me pagó') {
        balanceChange = -amount; // Disminuye lo que me deben
      } else if (type === 'Me prestó') {
        balanceChange = -amount; // Aumenta lo que yo debo (negativo)
      } else if (type === 'Le pagué') {
        balanceChange = amount; // Disminuye lo que yo debo (menos negativo)
      }

      const result = await this.db.runAsync(
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
      const movements = await this.db.getAllAsync(
        'SELECT * FROM movements WHERE debtor_id = ? ORDER BY created_at DESC',
        [debtorId]
      );
      return movements;
    } catch (error) {
      console.log('Error getting movements: ', error);
      throw error;
    }
  }

  // ============ STATISTICS ============

  async getTotalStats() {
    try {
      const result = await this.db.getFirstAsync(`
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

  // ============ BACKUP / RESTORE ============

  async exportData() {
    try {
      const debtors = await this.db.getAllAsync('SELECT * FROM debtors');
      const movements = await this.db.getAllAsync('SELECT * FROM movements ORDER BY created_at ASC');
      
      return {
        version: 1,
        exportDate: this.getCurrentDateTime(),
        app: 'Gestor de Cuentas',
        debtors,
        movements,
      };
    } catch (error) {
      console.log('Error exporting data: ', error);
      throw error;
    }
  }

  async importData(data) {
    try {
      if (!data || !data.debtors || !data.movements) {
        throw new Error('Formato de backup inválido');
      }

      // Eliminar datos actuales
      await this.db.execAsync('DELETE FROM movements');
      await this.db.execAsync('DELETE FROM debtors');

      // Importar deudores
      for (const debtor of data.debtors) {
        await this.db.runAsync(
          'INSERT INTO debtors (id, name, phone, balance, whatsapp_message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [debtor.id, debtor.name, debtor.phone, debtor.balance, debtor.whatsapp_message, debtor.created_at, debtor.updated_at]
        );
      }

      // Importar movimientos
      for (const movement of data.movements) {
        await this.db.runAsync(
          'INSERT INTO movements (id, debtor_id, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [movement.id, movement.debtor_id, movement.amount, movement.type, movement.description, movement.created_at]
        );
      }

      return true;
    } catch (error) {
      console.log('Error importing data: ', error);
      throw error;
    }
  }
}

export default new DatabaseService();
