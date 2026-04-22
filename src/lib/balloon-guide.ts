export const BALLOON_VALLEYS = [
  'Goreme Valley',
  'Soganli Valley',
  'Ihlara Valley',
  'Cat Valley',
] as const;

export const BALLOON_DEFAULT_THEME = 'Premium storytelling';
export const BALLOON_DEFAULT_DURATION = 25;

export const DIRECTIONAL_WARNING_PATTERN = /\b(left|right|below|above|ahead|behind|currently|current altitude|now flying|to your|under you|over you|step closer|turn around|next stop)\b/i;

const VALLEY_DISPLAY_NAMES: Record<string, string> = {
  'Goreme Valley': 'Göreme Valley',
  'Soganli Valley': 'Soğanlı Valley',
  'Ihlara Valley': 'Ihlara Valley',
  'Cat Valley': 'Çat Valley',
};

export const formatValleyName = (valley: string) => VALLEY_DISPLAY_NAMES[valley] ?? valley;

export const buildBalloonMasterTitle = (valleys: string[], region: string) => {
  const cleanRegion = region.trim() || 'Cappadocia';
  const displayValleys = valleys.map(formatValleyName);

  if (displayValleys.length === 0) {
    return `Discover ${cleanRegion} While Flying Over ${cleanRegion}`;
  }

  if (displayValleys.length === 1) {
    return `Discover ${displayValleys[0]} While Flying Over ${cleanRegion}`;
  }

  if (displayValleys.length === 2) {
    return `Discover ${displayValleys[0]} and ${displayValleys[1]} While Flying Over ${cleanRegion}`;
  }

  return `Discover ${displayValleys[0]}, ${displayValleys[1]} and More While Flying Over ${cleanRegion}`;
};

export const combineBalloonScripts = (scripts: string[]) => scripts.filter(Boolean).join('\n\n');

export const detectCoveredValleys = (script: string, valleys: string[]) => {
  const normalizedScript = script.toLowerCase();

  return valleys.map((valley) => {
    const valleyRoot = valley.toLowerCase().replace(' valley', '');
    return {
      valley,
      present: normalizedScript.includes(valleyRoot),
    };
  });
};

export const detectUnexpectedValleys = (script: string, selectedValleys: string[]) => {
  const normalizedScript = script.toLowerCase();

  return BALLOON_VALLEYS.filter((valley) => !selectedValleys.includes(valley)).filter((valley) => {
    const valleyRoot = valley.toLowerCase().replace(' valley', '');
    return normalizedScript.includes(valleyRoot);
  });
};