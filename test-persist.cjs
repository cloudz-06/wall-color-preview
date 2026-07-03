const { create } = require('zustand/vanilla');
const { persist, createJSONStorage } = require('zustand/middleware');

let storageDB = {};
const failingStorage = {
  getItem: (name) => storageDB[name] || null,
  setItem: (name, value) => {
    if (value.length > 100) {
      throw new Error('QuotaExceededError');
    }
    storageDB[name] = value;
  },
  removeItem: (name) => { delete storageDB[name] }
};

const store = create(
  persist(
    (set) => ({
      count: 0,
      text: '',
      inc: () => set(s => ({ count: s.count + 1 })),
      setText: (t) => set({ text: t })
    }),
    {
      name: 'test-store',
      storage: createJSONStorage(() => failingStorage)
    }
  )
);

try {
  store.getState().inc();
  console.log('inc worked');
  store.getState().setText('a'.repeat(200));
  console.log('setText worked (error swallowed)');
} catch (err) {
  console.log('CAUGHT ERROR:', err.message);
}
