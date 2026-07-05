import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface ProfilePrice {
  id: string;
  name: string;
  pricePerMeter: number;
}

export interface GlassPrice {
  id: string;
  name: string;
  pricePerSqm: number;
}

export interface HardwarePrice {
  id: string;
  name: string;
  pricePerSet: number;
}

export interface ExtraPrice {
  id: string;
  type: 'sill' | 'ebb' | 'mosquito' | 'slope';
  name: string;
  price: number;
  unit: 'm' | 'sqm' | 'pcs';
}

interface PricingState {
  profiles: ProfilePrice[];
  glass: GlassPrice[];
  hardware: HardwarePrice[];
  extras: ExtraPrice[];
  defaultMarkupPercent: number;
  kaspiPhone: string | null;
  selectedProfileId: string | null;
  selectedGlassId: string | null;
  loadFromSupabase: () => Promise<void>;
  setSelectedProfile: (id: string) => void;
  setSelectedGlass: (id: string) => void;
}

export const usePricingStore = create<PricingState>((set) => ({
  profiles: [],
  glass: [],
  hardware: [],
  extras: [],
  defaultMarkupPercent: 40,
  kaspiPhone: null,
  selectedProfileId: null,
  selectedGlassId: null,
  
  loadFromSupabase: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      { data: profData },
      { data: pData },
      { data: gData },
      { data: hData },
      { data: eData }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('materials_profile').select('*'),
      supabase.from('materials_glass').select('*'),
      supabase.from('materials_hardware').select('*'),
      supabase.from('materials_extras').select('*')
    ]);

    const profiles = pData ? pData.map(p => ({ id: p.id, name: p.name, pricePerMeter: p.price_per_meter })) : [];
    const glass = gData ? gData.map(g => ({ id: g.id, name: g.name, pricePerSqm: g.price_per_sqm })) : [];
    const hardware = hData ? hData.map(h => ({ id: h.id, name: h.name, pricePerSet: h.price_per_set })) : [];
    const extras = eData ? eData.map(e => ({ id: e.id, type: e.type, name: e.name, price: e.price, unit: e.unit })) : [];
    
    set({
      profiles,
      glass,
      hardware,
      extras,
      defaultMarkupPercent: profData?.default_markup_percent ?? 40,
      kaspiPhone: profData?.kaspi_phone || null,
      selectedProfileId: profiles.length > 0 ? profiles[0].id : null,
      selectedGlassId: glass.length > 0 ? glass[0].id : null,
    });
  },

  setSelectedProfile: (id) => set({ selectedProfileId: id }),
  setSelectedGlass: (id) => set({ selectedGlassId: id })
}));
