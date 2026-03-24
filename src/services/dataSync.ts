
import { syncService } from './syncService';
import { supabaseService } from './supabaseService';

class DataSync {
  private _isSyncing = false;
  private _isConnected = false;
  private lastSyncTime = 0;
  private onSyncStateChange: ((isSyncing: boolean) => void) | null = null;
  private onConnectionChange: ((isConnected: boolean) => void) | null = null;

  private syncTimeout: any = null;
  private debounceMs = 1000;

  constructor() {
    this.setupInterception();
  }

  public setOnSyncStateChange(callback: (isSyncing: boolean) => void) {
    this.onSyncStateChange = callback;
  }

  public setOnConnectionChange(callback: (isConnected: boolean) => void) {
    this.onConnectionChange = callback;
  }

  private set isSyncing(value: boolean) {
    this._isSyncing = value;
    if (this.onSyncStateChange) {
      this.onSyncStateChange(value);
    }
  }

  public get isSyncing() {
    return this._isSyncing;
  }

  private set isConnected(value: boolean) {
    this._isConnected = value;
    if (this.onConnectionChange) {
      this.onConnectionChange(value);
    }
  }

  public get isConnected() {
    return this._isConnected;
  }

  private setupInterception() {
    if (typeof window === 'undefined') return;

    const originalSetItem = localStorage.setItem;
    const self = this;

    localStorage.setItem = function(key: string, value: string) {
      const oldValue = localStorage.getItem(key);
      if (oldValue === value) return; // Skip if no change

      originalSetItem.apply(this, [key, value]);
      
      if (key.startsWith('perfil_') && !self.isSyncing) {
        self.debouncedSyncToServer();
      }
    };

    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('perfil_') && !this.isSyncing) {
        this.debouncedSyncToServer();
      }
    });
  }

  private debouncedSyncToServer() {
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.syncToServer();
    }, this.debounceMs);
  }

  private async syncToServer() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const allData: Record<string, string | null> = {};
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('perfil_')) {
          const val = localStorage.getItem(key);
          allData[key] = val;
          if (val) totalSize += val.length;
        }
      }
      
      // Safety check for large payloads (AI Studio limits)
      if (totalSize > 4 * 1024 * 1024) { // 4MB
        console.warn('DataSync: LocalStorage approaching limit, skipping sync to prevent crash');
        return;
      }

      const supabaseConfigured = await supabaseService.isConfigured();
      let res;
      
      if (supabaseConfigured) {
        res = await supabaseService.saveData(allData);
      } else {
        res = await syncService.saveData(allData);
      }

      this.isConnected = !!res;
      if (res?.lastUpdated) {
        this.lastSyncTime = res.lastUpdated;
      }
    } catch (error) {
      // Silent error for background sync to avoid UI noise
      this.isConnected = false;
    } finally {
      this.isSyncing = false;
    }
  }

  public async init() {
    await this.syncFromServer();
    
    // Start polling with safety check
    let isPolling = false;
    setInterval(async () => {
      if (isPolling || this.isSyncing) return;
      isPolling = true;
      try {
        const supabaseConfigured = await supabaseService.isConfigured();
        let serverLastUpdated;
        
        if (supabaseConfigured) {
          serverLastUpdated = await supabaseService.fetchLastUpdated();
        } else {
          serverLastUpdated = await syncService.fetchLastUpdated();
        }

        if (serverLastUpdated > this.lastSyncTime) {
          await this.syncFromServer();
        }
      } finally {
        isPolling = false;
      }
    }, 10000); // Increased to 10s for stability
  }

  private async syncFromServer() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const supabaseConfigured = await supabaseService.isConfigured();
      let payload;
      
      if (supabaseConfigured) {
        payload = await supabaseService.fetchData();
      } else {
        payload = await syncService.fetchData();
      }

      this.isConnected = !!payload;
      const serverData = payload?.data || payload;
      const serverLastUpdated = payload?.lastUpdated || 0;

      const hasServerData = serverData && typeof serverData === 'object' && Object.keys(serverData).length > 0;

      if (hasServerData) {
        Object.entries(serverData).forEach(([key, value]) => {
          if (key.startsWith('perfil_') && value !== null) {
            const currentLocal = localStorage.getItem(key);
            if (currentLocal !== value) {
              localStorage.setItem(key, value as string);
            }
          }
        });
        this.lastSyncTime = serverLastUpdated;
        window.dispatchEvent(new CustomEvent('perfil_sync_complete'));
      } else {
        // If server is empty but we have local data, push it
        const hasLocalData = Array.from({ length: localStorage.length })
          .some((_, i) => localStorage.key(i)?.startsWith('perfil_'));
        
        if (hasLocalData) {
          await this.syncToServer();
        }
      }
    } catch (error) {
      // Silent error for background sync to avoid UI noise
      this.isConnected = false;
    } finally {
      this.isSyncing = false;
    }
  }

  public async forceSync() {
    console.log('DataSync: Forcing master sync...');
    await this.syncToServer();
    await this.syncFromServer();
    console.log('DataSync: Master sync complete.');
  }

  public async clearLocalAndSync() {
    console.log('DataSync: Clearing local and pulling from cloud...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('perfil_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    this.lastSyncTime = 0;
    await this.syncFromServer();
  }

  public getLastSyncTime() {
    return this.lastSyncTime;
  }
}

export const dataSync = new DataSync();
