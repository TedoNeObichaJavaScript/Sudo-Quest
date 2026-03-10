export class IndexedDBManager {
  constructor() {
    this.dbName = 'SudoSolveDB';
    this.dbVersion = 1;
    this.db = null;
  }

  
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('userProgress')) {
          const progressStore = db.createObjectStore('userProgress', { keyPath: 'id' });
          progressStore.createIndex('currentLevel', 'currentLevel', { unique: false });
        }

        if (!db.objectStoreNames.contains('worldStateSnapshots')) {
          const snapshotStore = db.createObjectStore('worldStateSnapshots', { keyPath: 'levelId' });
          snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  
  async getUserProgress() {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userProgress'], 'readonly');
      const store = transaction.objectStore('userProgress');
      const request = store.get('default');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result || {
          id: 'default',
          completedLevels: [],
          currentLevel: 1,
          achievements: [],
          totalScore: 0,
          lastPlayed: Date.now()
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  
  async saveUserProgress(progress) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userProgress'], 'readwrite');
      const store = transaction.objectStore('userProgress');
      
      const data = {
        id: 'default',
        ...progress,
        lastPlayed: Date.now()
      };

      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  
  async saveWorldStateSnapshot(levelId, worldState) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['worldStateSnapshots'], 'readwrite');
      const store = transaction.objectStore('worldStateSnapshots');

      const snapshot = {
        levelId,
        worldState: JSON.parse(JSON.stringify(worldState)), // Deep clone
        timestamp: Date.now()
      };

      const request = store.put(snapshot);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  
  async getWorldStateSnapshot(levelId) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['worldStateSnapshots'], 'readonly');
      const store = transaction.objectStore('worldStateSnapshots');
      const request = store.get(levelId);

      request.onsuccess = () => resolve(request.result?.worldState || null);
      request.onerror = () => reject(request.error);
    });
  }
}