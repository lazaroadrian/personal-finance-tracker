import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = 'DebtManager.db';
const database_version = '1.0';
const database_displayname = 'Debt Manager Database';
const database_size = 200000;

class DatabaseService {
  initDB() {
    return new Promise((resolve, reject) => {
      SQLite.openDatabase(
        database_name,
        database_version,
        database_displayname,
        database_size
      )
        .then(DB => {
          this.db = DB;
          console.log('Database OPEN');
          this.createTables();
          resolve(DB);
        })
        .catch(error => {
          console.log('Error opening database: ', error);
          reject(error);
        });
    });
  }

  closeDatabase() {
    if (this.db) {
      console.log('Closing database');
      this.db.close()
        .then(status => {
          console.log('Database CLOSED');
        })
        .catch(error => {
          console.log('Error closing database: ', error);
        });
    } else {
      console.log('Database was not OPEN');
    }
  }

  createTables() {
    return this.db.transaction(tx => {
      // Tabla de deudores
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS debtors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          balance REAL DEFAULT 0,
          whatsapp_message TEXT DEFAULT 'Hola {name}, te contacto sobre el saldo pendiente de ${balance}.',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Tabla de historial de movimientos
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          debtor_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (debtor_id) REFERENCES debtors (id) ON DELETE CASCADE
        );`
      );
    }).then(() => {
      console.log('Tables created successfully');
    }).catch(error => {
      console.log('Error creating tables: ', error);
    });
  }

  // ============ DEBTORS CRUD ============

  addDebtor(name, phone, initialBalance = 0, whatsappMessage = null) {
    return new Promise((resolve, reject) => {
      const defaultMessage = `Hola ${name}, te contacto sobre el saldo pendiente de $${initialBalance}.`;
      const message = whatsappMessage || defaultMessage;

      this.db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO debtors (name, phone, balance, whatsapp_message) VALUES (?, ?, ?, ?)',
          [name, phone, initialBalance, message]
        ).then(([tx, results]) => {
          const debtorId = results.insertId;
          
          // Si hay un saldo inicial, crear el primer movimiento
          if (initialBalance !== 0) {
            const type = initialBalance > 0 ? 'Le presté' : 'Me prestó';
            tx.executeSql(
              'INSERT INTO movements (debtor_id, amount, type, description) VALUES (?, ?, ?, ?)',
              [debtorId, Math.abs(initialBalance), type, 'Saldo inicial']
            );
          }
          
          resolve(results);
        });
      }).catch(error => {
        console.log('Error adding debtor: ', error);
        reject(error);
      });
    });
  }

  getAllDebtors() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql('SELECT * FROM debtors ORDER BY updated_at DESC', [])
          .then(([tx, results]) => {
            const debtors = [];
            for (let i = 0; i < results.rows.length; i++) {
              debtors.push(results.rows.item(i));
            }
            resolve(debtors);
          });
      }).catch(error => {
        console.log('Error getting debtors: ', error);
        reject(error);
      });
    });
  }

  getDebtorById(id) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql('SELECT * FROM debtors WHERE id = ?', [id])
          .then(([tx, results]) => {
            if (results.rows.length > 0) {
              resolve(results.rows.item(0));
            } else {
              resolve(null);
            }
          });
      }).catch(error => {
        console.log('Error getting debtor: ', error);
        reject(error);
      });
    });
  }

  updateDebtor(id, name, phone, whatsappMessage) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'UPDATE debtors SET name = ?, phone = ?, whatsapp_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [name, phone, whatsappMessage, id]
        ).then(([tx, results]) => {
          resolve(results);
        });
      }).catch(error => {
        console.log('Error updating debtor: ', error);
        reject(error);
      });
    });
  }

  deleteDebtor(id) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Primero eliminar todos los movimientos asociados
        tx.executeSql('DELETE FROM movements WHERE debtor_id = ?', [id]);
        // Luego eliminar el deudor
        tx.executeSql('DELETE FROM debtors WHERE id = ?', [id])
          .then(([tx, results]) => {
            resolve(results);
          });
      }).catch(error => {
        console.log('Error deleting debtor: ', error);
        reject(error);
      });
    });
  }

  // ============ MOVEMENTS ============

  addMovement(debtorId, amount, type, description = '') {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Agregar el movimiento
        tx.executeSql(
          'INSERT INTO movements (debtor_id, amount, type, description) VALUES (?, ?, ?, ?)',
          [debtorId, amount, type, description]
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

        tx.executeSql(
          'UPDATE debtors SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [balanceChange, debtorId]
        ).then(([tx, results]) => {
          resolve(results);
        });
      }).catch(error => {
        console.log('Error adding movement: ', error);
        reject(error);
      });
    });
  }

  getMovementsByDebtor(debtorId) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM movements WHERE debtor_id = ? ORDER BY created_at DESC',
          [debtorId]
        ).then(([tx, results]) => {
          const movements = [];
          for (let i = 0; i < results.rows.length; i++) {
            movements.push(results.rows.item(i));
          }
          resolve(movements);
        });
      }).catch(error => {
        console.log('Error getting movements: ', error);
        reject(error);
      });
    });
  }

  // ============ STATISTICS ============

  getTotalStats() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as total_owed_to_me,
            SUM(CASE WHEN balance < 0 THEN balance ELSE 0 END) as total_i_owe,
            SUM(balance) as net_balance,
            COUNT(*) as total_debtors
          FROM debtors`,
          []
        ).then(([tx, results]) => {
          if (results.rows.length > 0) {
            resolve(results.rows.item(0));
          } else {
            resolve({
              total_owed_to_me: 0,
              total_i_owe: 0,
              net_balance: 0,
              total_debtors: 0
            });
          }
        });
      }).catch(error => {
        console.log('Error getting stats: ', error);
        reject(error);
      });
    });
  }
}

export default new DatabaseService();
