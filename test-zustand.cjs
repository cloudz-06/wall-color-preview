const { create } = require('zustand');
const { persist, createJSONStorage } = require('zustand/middleware');

let shouldThrow = true;

const mockStorage = {
  getItem: () => null,
  setItem: (name, value) => {
    if (shouldThrow) throw new Error('QuotaExceededError');
  },
  removeItem: () => {}
};

const useStore = create(persist((set) => ({
  count: 0,
  inc: () => set(state => ({ count: state.count + 1 }))
}), {
  name: 'test',
  storage: createJSONStorage(() => mockStorage)
}));

try {
  useStore.getState().inc();
} catch (e) {
  console.log('Caught:', e.message);
}

console.log('Count after inc:', useStore.getState().count);
