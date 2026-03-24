
export const syncService = {
  async fetchData() {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch data');
      const payload = await response.json();
      return payload.data || payload; // Handle both old and new format
    } catch (error) {
      console.error('Sync error:', error);
      return null;
    }
  },

  async fetchLastUpdated() {
    try {
      const response = await fetch('/api/last-updated');
      if (!response.ok) throw new Error('Failed to fetch last updated');
      const payload = await response.json();
      return payload.lastUpdated || 0;
    } catch (error) {
      console.error('Sync error:', error);
      return 0;
    }
  },

  async saveData(data: any) {
    try {
      console.log('Sending data to server...', Object.keys(data));
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save data');
      return await response.json();
    } catch (error) {
      console.error('Sync error:', error);
      return null;
    }
  }
};
