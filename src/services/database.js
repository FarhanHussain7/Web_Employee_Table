const DB_NAME = 'EmployeeDB';
const STORE_NAME = 'employees';
const DB_VERSION = 1;

let db = null;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      console.log('Database already initialized');
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening database', event);
      reject('Error opening database');
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // Create indexes for searchable fields
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('email', 'email', { unique: true });
        store.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('Database initialized');
      resolve(db);
    };
  });
};

export const addEmployee = async (employee) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(employee);

    request.onsuccess = () => resolve(employee);
    request.onerror = (event) => {
      console.error('Error adding employee', event);
      reject('Error adding employee');
    };
  });
};

export const updateEmployee = async (employee) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(employee);

    request.onsuccess = () => resolve(employee);
    request.onerror = (event) => {
      console.error('Error updating employee', event);
      reject('Error updating employee');
    };
  });
};

export const deleteEmployee = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => {
      console.error('Error deleting employee', event);
      reject('Error deleting employee');
    };
  });
};

export const getEmployee = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => {
      console.error('Error getting employee', event);
      reject('Error getting employee');
    };
  });
};

export const getAllEmployees = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => resolve(event.target.result || []);
    request.onerror = (event) => {
      console.error('Error getting employees', event);
      reject('Error getting employees');
    };
  });
};

export const searchEmployees = async (term) => {
  const employees = await getAllEmployees();
  if (!term) return employees;
  
  const searchTerm = term.toLowerCase();
  return employees.filter(emp => 
    [emp.name, emp.email, emp.phone, emp.workAuthorization, emp.endClient, 
     emp.accountManager, emp.recruiter, emp.status]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm)
  );
};
