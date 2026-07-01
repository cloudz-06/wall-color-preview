import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

export const useEditorStore = create(
  persist(
    (set, get) => ({
      // ── Image & Project ──────────────────────────────────────
      image: null,
      imageWidth: 0,
      imageHeight: 0,
      projectName: 'Untitled Project',
      soundEnabled: false,
      lightingMode: 'neutral',

      setProjectName: (name) => set({ projectName: name?.trim() || 'Untitled Project' }),
      setLightingMode: (mode) => set({ lightingMode: mode }),

      setImage: (dataURL, w, h, initialProjectName) =>
        set({
          image: dataURL,
          imageWidth: w,
          imageHeight: h,
          projectName: initialProjectName || 'Untitled Project',
          walls: [],
          activeWallId: null,
          activeCutoutId: null,
          editingVariationId: null,
          lightingMode: 'neutral',
        }),

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

      // ── Variations (Gallery) ──────────────────────────────
      variations: [],

      saveVariation: (snapshotDataURL) => {
        const { walls, imageWidth, imageHeight, projectName, lightingMode } = get();
        // FIX: Do NOT store `originalImage` (the full data URL) inside the variation.
        const safeWalls = Array.isArray(walls) ? JSON.parse(JSON.stringify(walls)) : [];
        const variation = {
          id:          `var-${Date.now()}`,
          projectName: projectName || 'Untitled Project',
          snapshot:    snapshotDataURL ?? null,
          imageWidth:  imageWidth  ?? 0,
          imageHeight: imageHeight ?? 0,
          walls:       safeWalls,
          lightingMode: lightingMode || 'neutral',
          createdAt:   new Date().toISOString(),
        };

        set(s => ({
          variations: [...(Array.isArray(s.variations) ? s.variations : []), variation],
          editingVariationId: null, // new save resets edit tracking
        }));
        return variation.id;
      },

      // updateVariation: immutable in-place update of an existing gallery entry.
      // Uses .map() to produce a brand-new array so Zustand detects the change
      // and the persist middleware serializes it to localStorage.
      updateVariation: (varId, snapshotDataURL) => {
        const { walls, imageWidth, imageHeight, projectName, lightingMode } = get();
        const safeWalls = Array.isArray(walls) ? JSON.parse(JSON.stringify(walls)) : [];
        set(s => ({
          variations: (Array.isArray(s.variations) ? s.variations : []).map(v =>
            v.id === varId
              ? {
                  ...v,
                  projectName: projectName || v.projectName,
                  snapshot:    snapshotDataURL ?? v.snapshot,
                  walls:       safeWalls,
                  imageWidth:  imageWidth  ?? v.imageWidth,
                  imageHeight: imageHeight ?? v.imageHeight,
                  lightingMode: lightingMode ?? v.lightingMode ?? 'neutral',
                  updatedAt:   new Date().toISOString(),
                }
              : v
          ),
          editingVariationId: null,
        }));
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
        const { variations, imageWidth: currentW, imageHeight: currentH } = get();
        const v = variations.find(x => x.id === varId);
        if (!v) return;
        // Restore the canvas dimensions and name saved with the variation.
        set({
          projectName:        v.projectName || 'Untitled Project',
          walls:              JSON.parse(JSON.stringify(v.walls ?? [])),
          imageWidth:         v.imageWidth  || currentW,

          imageHeight:        v.imageHeight || currentH,
          activeCutoutId:     null,
          editingVariationId: varId, // signals Save to call updateVariation
          lightingMode:       v.lightingMode || 'neutral',
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
        soundEnabled: state.soundEnabled,
        lightingMode: state.lightingMode,
        // editingVariationId is ephemeral — intentionally NOT persisted
      }),

      version: 3, // bumped from 2: added projectName

      migrate: (persistedState, version) => {
        const safe = persistedState ?? {};

        // Migrate old variations to have a projectName and lightingMode
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
                lightingMode: rest.lightingMode || 'neutral',
              };
            }).filter(Boolean)
          : [];

        return {
          ...safe,
          variations,
          walls:        Array.isArray(safe.walls) ? safe.walls : [],
          imageWidth:   safe.imageWidth  ?? 0,
          imageHeight:  safe.imageHeight ?? 0,
          projectName:  safe.projectName || 'Untitled Project',
          soundEnabled: safe.soundEnabled ?? false,
          lightingMode: safe.lightingMode || 'neutral',
        };
      },

      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState ?? {}),
        // Always reset ephemeral selections on reload
        activeWallId:       null,
        activeCutoutId:     null,
        activeTool:         'polygon',
        activePanel:        'color',
        editingVariationId: null,
      }),
    }
  )
);
