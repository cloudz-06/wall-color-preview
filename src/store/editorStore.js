import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

let wallIdCounter = 0;
let cutoutIdCounter = 0;
let windowIdCounter = 0;

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

const createWindow = (overrides = {}) => ({
  id: `window-${++windowIdCounter}`,
  label: `Window ${windowIdCounter}`,
  points: [],
  closed: false,
  ...overrides,
});

export const useEditorStore = create(
  persist(
    (set, get) => ({
      // ── Image & Project ──────────────────────────────────────
      image: null,
      imageWidth: 0,
      imageHeight: 0,
      projectName: 'Untitled Project',
      soundEnabled: false,

      setProjectName: (name) => set({ projectName: name?.trim() || 'Untitled Project' }),

      setImage: (dataURL, w, h, initialProjectName) =>
        set({
          image: dataURL,
          imageWidth: w,
          imageHeight: h,
          projectName: initialProjectName || 'Untitled Project',
          walls: [],
          windows: [],
          activeWallId: null,
          activeWindowId: null,
          activeCutoutId: null,
          editingVariationId: null,
        }),

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

      // ── Walls ──────────────────────────────────────────────
      walls: [],
      activeWallId: null,

      // ── Windows ────────────────────────────────────────────
      windows: [],
      activeWindowId: null,

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

      addWindow: () => {
        const win = createWindow();
        set(s => ({ windows: [...s.windows, win], activeWindowId: win.id, activeWallId: null, activeCutoutId: null }));
        return win.id;
      },

      deleteWindow: (id) =>
        set(s => {
          const windows = s.windows.filter(w => w.id !== id);
          const activeWindowId = s.activeWindowId === id ? (windows[0]?.id ?? null) : s.activeWindowId;
          return { windows, activeWindowId };
        }),

      setActiveWindow: (id) => set({ activeWindowId: id, activeWallId: null, activeCutoutId: null }),

      addPointToActiveWindow: (x, y) => {
        const { windows, activeWindowId } = get();
        set({
          windows: windows.map(w =>
            w.id === activeWindowId ? { ...w, points: [...w.points, x, y] } : w
          ),
        });
      },

      closeActiveWindow: () => {
        const { windows, activeWindowId } = get();
        set({
          windows: windows.map(w =>
            w.id === activeWindowId ? { ...w, closed: true } : w
          ),
        });
      },

      undoLastPoint: () => {
        const { walls, windows, activeWallId, activeWindowId, activeCutoutId, activeTool } = get();
        
        if (activeTool === 'window' && activeWindowId) {
          set({
            windows: windows.map(w =>
              w.id === activeWindowId && !w.closed
                ? { ...w, points: w.points.slice(0, -2) }
                : w
            ),
          });
          return;
        }

        if (activeCutoutId) {
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
        } else if (activeWallId) {
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

      resetActiveWindowPoints: () => {
        const { windows, activeWindowId } = get();
        set({
          windows: windows.map(w =>
            w.id === activeWindowId
              ? { ...w, points: [], closed: false }
              : w
          ),
        });
      },

      // ── Cutouts ────────────────────────────────────────────
      activeCutoutId: null,

      addCutout: () => {
        const { walls, activeWallId } = get();
        const activeWall = walls.find(w => w.id === activeWallId);
        if (!activeWall || !activeWall.closed) return null;
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
          activeCutoutId: null,
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
      activeTool: 'polygon',
      setActiveTool: (tool) => set({ activeTool: tool }),

      // ── Panel ─────────────────────────────────────────────
      activePanel: 'color',
      setActivePanel: (panel) => set({ activePanel: panel }),

      // ── Editing state ──────────────────────────────────────
      // When the user opens a Gallery card for editing, we track its ID so
      // that the Save button knows to UPDATE rather than APPEND a new variation.
      // This is ephemeral — not persisted to localStorage.
      editingVariationId: null,
          variations: [],

      saveVariation: (snapshotDataURL) => {
        console.log('--- saveVariation called ---');
        console.log('editingVariationId before save:', get().editingVariationId);
        const { walls, windows, imageWidth, imageHeight, projectName } = get();
        
        // Filter out incomplete drafts when saving
        const safeWalls = Array.isArray(walls) 
          ? JSON.parse(JSON.stringify(walls.filter(w => w.closed))) 
          : [];
        const safeWindows = Array.isArray(windows)
          ? JSON.parse(JSON.stringify(windows.filter(w => w.closed)))
          : [];
          
        const variation = {
          id:          `var-${Date.now()}`,
          projectName: projectName || 'Untitled Project',
          snapshot:    snapshotDataURL ?? null,
          imageWidth:  imageWidth  ?? 0,
          imageHeight: imageHeight ?? 0,
          walls:       safeWalls,
          windows:     safeWindows,
          createdAt:   new Date().toISOString(),
        };

          const previousVariations = get().variations;
          try {
            set(s => {
              console.log('saveVariation setting state! Count will go from', (s.variations || []).length, 'to', (s.variations || []).length + 1);
              return {
                variations: [...(Array.isArray(s.variations) ? s.variations : []), variation],
                editingVariationId: null, // new save resets edit tracking
              };
            });
            return variation.id;
          } catch (err) {
            console.error('[Store] Failed to save variation to storage:', err);
            // Rollback in-memory state so Gallery stays in sync with disk
            set({ variations: previousVariations });
            throw err;
          }
      },

      // updateVariation: immutable in-place update of an existing gallery entry.
      // Uses .map() to produce a brand-new array so Zustand detects the change
      // and the persist middleware serializes it to localStorage.
      updateVariation: (varId, snapshotDataURL) => {
        console.log('--- updateVariation called ---');
        console.log('varId:', varId, 'editingVariationId:', get().editingVariationId);
        const { walls, windows, imageWidth, imageHeight, projectName } = get();
        const safeWalls = Array.isArray(walls) 
          ? JSON.parse(JSON.stringify(walls.filter(w => w.closed))) 
          : [];
        const safeWindows = Array.isArray(windows)
          ? JSON.parse(JSON.stringify(windows.filter(w => w.closed)))
          : [];
                  const previousVariations = get().variations;
          try {
            set(s => ({
              variations: (Array.isArray(s.variations) ? s.variations : []).map(v =>
                v.id === varId
                  ? {
                      ...v,
                      projectName: projectName || v.projectName,
                      snapshot:    snapshotDataURL ?? v.snapshot,
                      walls:       safeWalls,
                      windows:     safeWindows,
                      imageWidth:  imageWidth  ?? v.imageWidth,
                      imageHeight: imageHeight ?? v.imageHeight,
                      updatedAt:   new Date().toISOString(),
                    }
                  : v
              ),
              // We intentionally do NOT clear editingVariationId here.
            }));
          } catch (err) {
            console.error('[Store] Failed to update variation in storage:', err);
            set({ variations: previousVariations });
            throw err;
          }
          // We intentionally do NOT clear editingVariationId here.
          // This ensures subsequent saves while still in the editor continue to update the same gallery entry.
      },

      renameVariation: (varId, newName) => {
        const finalName = newName?.trim() || 'Untitled Project';
        set(s => ({
          variations: (Array.isArray(s.variations) ? s.variations : []).map(v =>
            v.id === varId
              ? { ...v, projectName: finalName, updatedAt: new Date().toISOString() }
              : v
          ),
          // If we rename the currently editing variation, also update the top bar
          projectName: s.editingVariationId === varId ? finalName : s.projectName,
        }));
      },

      loadVariation: (varId) => {
        console.log('--- loadVariation called ---');
        console.log('Loading varId:', varId);
        const { variations, imageWidth: currentW, imageHeight: currentH } = get();
        const v = variations.find(x => x.id === varId);
        if (!v) {
          console.log('Variation not found!', varId);
          return;
        }
        
        console.log('Variation found, setting editingVariationId to:', varId);
        // Restore the canvas dimensions and name saved with the variation.
        set({
          projectName:        v.projectName || 'Untitled Project',
          walls:              JSON.parse(JSON.stringify(v.walls ?? [])),
          windows:            JSON.parse(JSON.stringify(v.windows ?? [])),
          imageWidth:         v.imageWidth  || currentW,

          imageHeight:        v.imageHeight || currentH,
          activeCutoutId:     null,
          editingVariationId: varId, // signals Save to call updateVariation
        });
      },

      deleteVariation: (varId) =>
        set(s => ({
          variations: (Array.isArray(s.variations) ? s.variations : []).filter(v => v.id !== varId),
          editingVariationId: s.editingVariationId === varId ? null : s.editingVariationId,
        })),

      clearVariations: () => set({ variations: [], editingVariationId: null }),
    }),

    // ── Persist configuration ──────────────────────────────────
    {
      name: 'wall-paint-store',

      storage: createJSONStorage(() => localStorage),

      // Only persist data that should survive a refresh.
      // Ephemeral UI state is intentionally excluded.
      partialize: (state) => ({
        variations:   state.variations,   // gallery designs
        image:        state.image,        // room photo
        imageWidth:   state.imageWidth,
        imageHeight:  state.imageHeight,
        projectName:  state.projectName,
        walls:        state.walls,
        windows:      state.windows,
        soundEnabled: state.soundEnabled,
        // editingVariationId is ephemeral — intentionally NOT persisted
      }),

      version: 3, // bumped from 2: added projectName

      migrate: (persistedState, version) => {
        const safe = persistedState ?? {};

        // Migrate old variations to have a projectName
        const variations = Array.isArray(safe.variations)
          ? safe.variations.map(v => {
              if (!v || typeof v !== 'object') return null;
              // Remove the heavyweight originalImage field if it exists
              const { originalImage, ...rest } = v;
              return {
                ...rest,
                projectName: rest.projectName || 'Untitled Project',
                imageWidth:  rest.imageWidth  ?? safe.imageWidth  ?? 0,
                imageHeight: rest.imageHeight ?? safe.imageHeight ?? 0,
                createdAt:   rest.createdAt   ?? new Date().toISOString(),
                walls:       Array.isArray(rest.walls) ? rest.walls : [],
                windows:     Array.isArray(rest.windows) ? rest.windows : [],
              };
            }).filter(Boolean)
          : [];

        return {
          ...safe,
          variations,
          walls:        Array.isArray(safe.walls) ? safe.walls : [],
          windows:      Array.isArray(safe.windows) ? safe.windows : [],
          imageWidth:   safe.imageWidth  ?? 0,
          imageHeight:  safe.imageHeight ?? 0,
          projectName:  safe.projectName || 'Untitled Project',
          soundEnabled: safe.soundEnabled ?? false,
        };
      },

      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState ?? {}),
        // Always reset ephemeral selections on reload
        activeWallId:       null,
        activeWindowId:     null,
        activeCutoutId:     null,
        activeTool:         'polygon',
        activePanel:        'color',
        editingVariationId: null,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.useEditorStore = useEditorStore;
}
