const { create } = require('zustand');
const { persist, createJSONStorage } = require('zustand/middleware');

const mockStorage = {
  getItem: () => null,
  setItem: (name, value) => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {}
};

const useStore = create(persist((set) => ({
  editingId: null,
  walls: [],
  loadVariation: () => {
    console.log('loadVariation called');
    try {
        set({ editingId: 'var-123', walls: [{id: 1}] });
    } catch(e) {
        console.log('Caught in loadVariation:', e.message);
    }
  }
}), {
  name: 'test',
  storage: createJSONStorage(() => mockStorage),
  partialize: state => ({ walls: state.walls })
}));

useStore.getState().loadVariation();
console.log('editingId is now:', useStore.getState().editingId);
