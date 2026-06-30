import { create } from 'zustand';

let wallIdCounter = 0;
let cutoutIdCounter = 0;

const createCutout = () => ({
  id: `cutout-${++cutoutIdCounter}`,
  points: [],   // flat [x,y,x,y,...] in image coords
  closed: false,
});

const createWall = (overrides = {}) => ({
  id: `wall-${++wallIdCounter}`,
  label: `Wall ${wallIdCounter}`,
  points: [],        // flat array [x,y,x,y,...] in image coordinates
  closed: false,
  color: '#F5E6D0',
  opacity: 0.6,
  mode: 'color',     // 'color' | 'wallpaper'
  wallpaperUrl: null,
  wallpaperScale: 1,
  wallpaperOpacity: 0.85,
  cutouts: [],       // Array<{id, points[], closed}> — exclusion zones
  ...overrides,
});

export const useEditorStore = create((set, get) => ({
  // ── Image ──────────────────────────────────────────────
  image: null,
  imageWidth: 0,
  imageHeight: 0,
  soundEnabled: false,

  setImage: (dataURL, w, h) =>
    set({ image: dataURL, imageWidth: w, imageHeight: h, walls: [], activeWallId: null, activeCutoutId: null }),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  // ── Walls ──────────────────────────────────────────────
  walls: [],
  activeWallId: null,

  addWall: () => {
    const wall = createWall();
    set(s => ({ walls: [...s.walls, wall], activeWallId: wall.id, activeCutoutId: null }));
    return wall.id;
  },

  deleteWall: (id) =>
    set(s => {
      const walls = s.walls.filter(w => w.id !== id);
      const activeWallId = s.activeWallId === id ? (walls[0]?.id ?? null) : s.activeWallId;
      return { walls, activeWallId, activeCutoutId: null };
    }),

  setActiveWall: (id) => set({ activeWallId: id, activeCutoutId: null }),

  updateWall: (id, patch) =>
    set(s => ({ walls: s.walls.map(w => w.id === id ? { ...w, ...patch } : w) })),

  getActiveWall: () => {
    const { walls, activeWallId } = get();
    return walls.find(w => w.id === activeWallId) ?? null;
  },

  addPointToActiveWall: (x, y) => {
    const { walls, activeWallId } = get();
    set({
      walls: walls.map(w =>
        w.id === activeWallId ? { ...w, points: [...w.points, x, y] } : w
      ),
    });
  },

  closeActiveWall: () => {
    const { walls, activeWallId } = get();
    set({
      walls: walls.map(w =>
        w.id === activeWallId ? { ...w, closed: true } : w
      ),
    });
  },

  undoLastPoint: () => {
    const { walls, activeWallId, activeCutoutId } = get();
    if (activeCutoutId) {
      // Undo last cutout point
      set({
        walls: walls.map(w => w.id === activeWallId
          ? {
            ...w,
            cutouts: w.cutouts.map(c =>
              c.id === activeCutoutId && !c.closed
                ? { ...c, points: c.points.slice(0, -2) }
                : c
            ),
          }
          : w
        ),
      });
    } else {
      // Undo last wall point
      set({
        walls: walls.map(w =>
          w.id === activeWallId && !w.closed
            ? { ...w, points: w.points.slice(0, -2) }
            : w
        ),
      });
    }
  },

  resetActiveWallPoints: () => {
    const { walls, activeWallId } = get();
    set({
      walls: walls.map(w =>
        w.id === activeWallId
          ? { ...w, points: [], closed: false, cutouts: [] }
          : w
      ),
      activeCutoutId: null,
    });
  },

  // ── Cutouts ────────────────────────────────────────────
  activeCutoutId: null,

  /** Start drawing a new cutout on the active wall */
  addCutout: () => {
    const { walls, activeWallId } = get();
    const activeWall = walls.find(w => w.id === activeWallId);
    if (!activeWall || !activeWall.closed) return null; // must select wall first
    const cutout = createCutout();
    set({
      walls: walls.map(w =>
        w.id === activeWallId
          ? { ...w, cutouts: [...w.cutouts, cutout] }
          : w
      ),
      activeCutoutId: cutout.id,
    });
    return cutout.id;
  },

  addPointToActiveCutout: (x, y) => {
    const { walls, activeWallId, activeCutoutId } = get();
    if (!activeCutoutId) return;
    set({
      walls: walls.map(w =>
        w.id === activeWallId
          ? {
            ...w,
            cutouts: w.cutouts.map(c =>
              c.id === activeCutoutId && !c.closed
                ? { ...c, points: [...c.points, x, y] }
                : c
            ),
          }
          : w
      ),
    });
  },

  closeActiveCutout: () => {
    const { walls, activeWallId, activeCutoutId } = get();
    if (!activeCutoutId) return;
    set({
      walls: walls.map(w =>
        w.id === activeWallId
          ? {
            ...w,
            cutouts: w.cutouts.map(c =>
              c.id === activeCutoutId ? { ...c, closed: true } : c
            ),
          }
          : w
      ),
      activeCutoutId: null, // done drawing this cutout
    });
  },

  deleteLastCutout: () => {
    const { walls, activeWallId } = get();
    const activeWall = walls.find(w => w.id === activeWallId);
    if (!activeWall || activeWall.cutouts.length === 0) return;
    set({
      walls: walls.map(w =>
        w.id === activeWallId
          ? { ...w, cutouts: w.cutouts.slice(0, -1) }
          : w
      ),
      activeCutoutId: null,
    });
  },

  setActiveCutout: (id) => set({ activeCutoutId: id }),

  // ── Tool ──────────────────────────────────────────────
  activeTool: 'polygon', // 'polygon' | 'cutout' | 'eraser' | 'pan'
  setActiveTool: (tool) => set({ activeTool: tool }),

  // ── Panel ─────────────────────────────────────────────
  activePanel: 'color',
  setActivePanel: (panel) => set({ activePanel: panel }),

  // ── Variations (Gallery) ──────────────────────────────
  variations: [],

  saveVariation: (snapshotDataURL) => {
    const { walls, image } = get();
    const variation = {
      id: `var-${Date.now()}`,
      snapshot: snapshotDataURL,
      originalImage: image,
      walls: JSON.parse(JSON.stringify(walls)),
      createdAt: new Date().toISOString(),
    };
    set(s => ({ variations: [...s.variations, variation] }));
    return variation.id;
  },

  loadVariation: (varId) => {
    const { variations } = get();
    const v = variations.find(x => x.id === varId);
    if (!v) return;
    set({ image: v.originalImage, walls: JSON.parse(JSON.stringify(v.walls)), activeCutoutId: null });
  },

  deleteVariation: (varId) =>
    set(s => ({ variations: s.variations.filter(v => v.id !== varId) })),
}));
