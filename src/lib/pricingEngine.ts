import type { WindowConfig, Section } from '../store/windowStore';
import { usePricingStore } from '../store/pricingStore';

export interface CalculationResult {
  profileLength: number; // in meters
  glassArea: number; // in sqm
  sashCount: number;
  extrasCost: number;
  materialsCost: number;
  retailPrice: number;
}

export const calculateWindow = (config: WindowConfig): CalculationResult => {
  const { profiles, glass, hardware, extras, selectedProfileId: globalProfileId, selectedGlassId: globalGlassId, defaultMarkupPercent } = usePricingStore.getState();
  
  const effectiveProfileId = config.profileId || globalProfileId;
  const effectiveGlassId = config.glassId || globalGlassId;

  const selectedProfile = profiles.find(p => p.id === effectiveProfileId);
  const selectedGlass = glass.find(g => g.id === effectiveGlassId);

  let totalProfileLengthMm = 0;
  let totalGlassAreaSqMm = 0;
  let sashCount = 0;
  let hardwareSetsCost = 0;

  // Frame perimeter
  totalProfileLengthMm += (config.width * 2) + (config.height * 2);

  const traverseSection = (section: Section, w: number, h: number) => {
    if (section.type === 'split-v') {
      const split = section.splitRatio || 0.5;
      const leftW = w * split;
      const rightW = w * (1 - split);
      totalProfileLengthMm += h; // the vertical mullion
      
      if (section.children && section.children.length === 2) {
        traverseSection(section.children[0], leftW, h);
        traverseSection(section.children[1], rightW, h);
      }
    } else if (section.type === 'split-h') {
      const split = section.splitRatio || 0.5;
      const topH = h * split;
      const bottomH = h * (1 - split);
      totalProfileLengthMm += w; // the horizontal mullion
      
      if (section.children && section.children.length === 2) {
        traverseSection(section.children[0], w, topH);
        traverseSection(section.children[1], w, bottomH);
      }
    } else if (section.type === 'sash') {
      // Sash perimeter
      totalProfileLengthMm += (w * 2) + (h * 2);
      totalGlassAreaSqMm += (w * h);
      sashCount += 1;
      
      // Hardware
      if (section.openingMode === 'tilt-turn') {
        const hW = hardware.find(h => h.name.includes('откид'));
        if (hW) hardwareSetsCost += hW.pricePerSet;
      } else if (section.openingMode === 'turn') {
        const hW = hardware.find(h => h.name.includes('Поворотная'));
        if (hW) hardwareSetsCost += hW.pricePerSet;
      } else {
        // default hardware if opening
        hardwareSetsCost += 3500;
      }
    } else if (section.type === 'fixed') {
      totalGlassAreaSqMm += (w * h);
    }
  };

  traverseSection(config.rootSection, config.width, config.height);

  // Add 10% scrap
  const profileMeters = (totalProfileLengthMm / 1000) * 1.1;
  const glassSqm = totalGlassAreaSqMm / 1000000;

  const profileCost = selectedProfile ? profileMeters * selectedProfile.pricePerMeter : 0;
  const glassCost = selectedGlass ? glassSqm * selectedGlass.pricePerSqm : 0;

  // Extras
  let extrasCost = 0;
  if (config.extras) {
    const sill = extras.find(e => e.type === 'sill');
    if (sill) extrasCost += (config.extras.sillLength / 1000) * sill.price;
    
    const ebb = extras.find(e => e.type === 'ebb');
    if (ebb) extrasCost += (config.extras.ebbLength / 1000) * ebb.price;
    
    const slope = extras.find(e => e.type === 'slope');
    if (slope) extrasCost += (config.extras.slopesLength / 1000) * slope.price;

    const mosquito = extras.find(e => e.type === 'mosquito');
    if (mosquito) extrasCost += config.extras.mosquitoCount * mosquito.price;
  }

  const materialsCost = profileCost + glassCost + hardwareSetsCost + extrasCost;
  const retailPrice = materialsCost * (1 + defaultMarkupPercent / 100);

  return {
    profileLength: profileMeters,
    glassArea: glassSqm,
    sashCount,
    extrasCost,
    materialsCost,
    retailPrice
  };
};
