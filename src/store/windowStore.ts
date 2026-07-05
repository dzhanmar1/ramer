import { create } from 'zustand'

export type SectionType = 'split-v' | 'split-h' | 'sash' | 'fixed';
export type OpeningMode = 'fixed' | 'turn' | 'tilt-turn' | 'tilt';

export interface Section {
  id: string;
  type: SectionType;
  // If split-v, width is the coordinate or ratio. For simplicity, ratio (0 to 1), default 0.5.
  splitRatio?: number; 
  children?: Section[]; // exactly 2 children if split
  openingMode?: OpeningMode;
}

export interface WindowConfig {
  id: string;
  width: number; // in mm
  height: number; // in mm
  profileColor: string;
  profileId?: string;
  glassId?: string;
  rootSection: Section;
  extras: {
    sillLength: number;
    ebbLength: number;
    mosquitoCount: number;
    slopesLength: number;
  };
}

interface WindowState {
  config: WindowConfig;
  currentOrderId: string | null;
  clientName: string;
  clientPhone: string;
  updateWidth: (width: number) => void;
  updateHeight: (height: number) => void;
  updateProfileColor: (color: string) => void;
  updateProfileId: (id: string) => void;
  updateGlassId: (id: string) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  updateExtras: (updates: Partial<WindowConfig['extras']>) => void;
  splitSection: (id: string, direction: 'split-v' | 'split-h') => void;
  removeSplit: (id: string) => void;
  updateSplitRatio: (id: string, ratio: number) => void;
  loadOrder: (orderId: string, clientName: string, clientPhone: string, config: WindowConfig) => void;
  resetConfig: () => void;
  
  // History
  history: WindowConfig[];
  historyIndex: number;
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const createInitialConfig = (): WindowConfig => ({
  id: crypto.randomUUID(),
  width: 1300,
  height: 1400,
  profileColor: 'white',
  extras: {
    sillLength: 0,
    ebbLength: 0,
    mosquitoCount: 0,
    slopesLength: 0
  },
  rootSection: {
    id: crypto.randomUUID(),
    type: 'fixed',
    openingMode: 'fixed'
  }
});

const updateSectionInTree = (section: Section, id: string, updater: (s: Section) => Section): Section => {
  if (section.id === id) {
    return updater(section);
  }
  if (section.children) {
    return {
      ...section,
      children: section.children.map(child => updateSectionInTree(child, id, updater))
    };
  }
  return section;
};

const findSectionParent = (section: Section, id: string): Section | null => {
  if (!section.children) return null;
  if (section.children.some(c => c.id === id)) return section;
  for (const child of section.children) {
    const found = findSectionParent(child, id);
    if (found) return found;
  }
  return null;
}

export const useWindowStore = create<WindowState>((set, get) => ({
  config: createInitialConfig(),
  currentOrderId: null,
  clientName: '',
  clientPhone: '',
  history: [],
  historyIndex: -1,
  
  commitHistory: () => set((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(state.config)));
    return { history: newHistory, historyIndex: newHistory.length - 1 };
  }),

  undo: () => set((state) => {
    if (state.historyIndex >= 0) {
      const prevConfig = state.history[state.historyIndex];
      // Push current config to next spot if we are at the end, so we can redo back to current?
      // Wait, if historyIndex is exactly at the end of history array, we need to save current config first!
      let newHistory = [...state.history];
      if (state.historyIndex === state.history.length - 1) {
         newHistory.push(JSON.parse(JSON.stringify(state.config)));
      }
      return { 
        config: JSON.parse(JSON.stringify(newHistory[state.historyIndex])), 
        historyIndex: state.historyIndex - 1,
        history: newHistory
      };
    }
    return state;
  }),

  redo: () => set((state) => {
    if (state.historyIndex + 2 < state.history.length) {
      const nextIndex = state.historyIndex + 2;
      return { 
        config: JSON.parse(JSON.stringify(state.history[nextIndex])), 
        historyIndex: state.historyIndex + 1 
      };
    } else if (state.historyIndex + 1 < state.history.length) {
       const nextIndex = state.historyIndex + 1;
       return { 
        config: JSON.parse(JSON.stringify(state.history[nextIndex])), 
        historyIndex: state.historyIndex + 1 
      };
    }
    return state;
  }),

  updateWidth: (width) => set((state) => ({ config: { ...state.config, width } })),
  updateHeight: (height) => set((state) => ({ config: { ...state.config, height } })),
  updateProfileColor: (color) => set((state) => ({ config: { ...state.config, profileColor: color } })),
  updateProfileId: (id) => set((state) => ({ config: { ...state.config, profileId: id } })),
  updateGlassId: (id) => set((state) => ({ config: { ...state.config, glassId: id } })),
  updateSection: (id, updates) => {
    get().commitHistory();
    set((state) => ({
      config: {
        ...state.config,
        rootSection: updateSectionInTree(state.config.rootSection, id, (s) => ({ ...s, ...updates }))
      }
    }));
  },
  updateExtras: (updates) => set((state) => ({
    config: {
      ...state.config,
      extras: { ...state.config.extras, ...updates }
    }
  })),
  splitSection: (id, direction) => {
    get().commitHistory();
    set((state) => ({
      config: {
        ...state.config,
        rootSection: updateSectionInTree(state.config.rootSection, id, (s) => ({
          ...s,
          type: direction,
          splitRatio: 0.5,
          children: [
            { id: crypto.randomUUID(), type: 'fixed', openingMode: 'fixed' },
            { id: crypto.randomUUID(), type: 'fixed', openingMode: 'fixed' }
          ]
        }))
      }
    }));
  },
  removeSplit: (id) => {
    get().commitHistory();
    set((state) => ({
      config: {
        ...state.config,
        rootSection: updateSectionInTree(state.config.rootSection, id, (s) => ({
          ...s,
          type: 'fixed',
          splitRatio: undefined,
          children: undefined,
          openingMode: 'fixed'
        }))
      }
    }));
  },
  updateSplitRatio: (id, ratio) => set((state) => ({
    config: {
      ...state.config,
      rootSection: updateSectionInTree(state.config.rootSection, id, (s) => ({
        ...s,
        splitRatio: Math.max(0.1, Math.min(0.9, ratio)) // Constrain between 10% and 90%
      }))
    }
  })),
  loadOrder: (orderId, clientName, clientPhone, config) => set({
    currentOrderId: orderId,
    clientName,
    clientPhone,
    config
  }),
  resetConfig: () => set({ 
    config: createInitialConfig(),
    currentOrderId: null,
    clientName: '',
    clientPhone: '',
    history: [],
    historyIndex: -1
  })
}));
