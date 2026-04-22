// Rich knowledge base for Cappadocia balloon flight areas
// Each takeoff valley has its own visible corridor and unique heritage
// Scripts MUST cover ALL visible valleys/landmarks, not just the takeoff point

interface ValleyEntry {
  name: string;
  description: string;
}

interface FlightArea {
  regionName: string;
  visibleValleys: ValleyEntry[];
  visibleLandmarks: string[];
  geologicalStory: string;
  culturalLayers: string[];
  hiddenGems: string[];
  localLegends: string[];
}

export const FLIGHT_AREAS: Record<string, FlightArea> = {
  'Goreme Valley': {
    regionName: 'Central Cappadocia — Goreme Basin',
    visibleValleys: [
      { name: 'Love Valley (Baglidere)', description: 'Tall phallic fairy chimneys up to 40 meters, iconic sunrise shots' },
      { name: 'Rose Valley (Güllüdere)', description: 'Pink-tinged cliffs from iron oxide, hidden Byzantine chapels' },
      { name: 'Red Valley (Kızılçukur)', description: 'Iron-rich red rock, spectacular sunset glow, apple orchards' },
      { name: 'Pigeon Valley (Güvercinlik)', description: 'Thousands of dovecotes carved into cliffs for centuries of agriculture' },
      { name: 'Meskendir Valley', description: 'Quiet apricot and walnut groves, narrow hiking corridors' },
      { name: 'Sword Valley (Kiliclar)', description: 'Sharp narrow ridges like sword blades carved by erosion' },
      { name: 'Zemi Valley', description: 'Green oasis with cooler microclimate, tree-lined floor' },
      { name: 'Devrent Valley (Imagination)', description: 'Animal-shaped rocks including the famous Camel Rock' },
      { name: 'Pasabag Valley (Monks Valley)', description: 'Three-capped fairy chimneys, home to hermit monks' },
    ],
    visibleLandmarks: [
      'Uçhisar Castle — highest point of Cappadocia, a natural tuff fortress with pigeon houses',
      'Goreme Open-Air Museum — UNESCO World Heritage rock-cut monastery complex',
      'Cavusin ruins — abandoned cliff village evacuated after 1950s rockfall',
      'Aktepe fairy chimneys — distinctive cluster visible from the basin',
      'Ortahisar Castle visible to the south',
      'Mount Erciyes (3,917m active volcano) on the eastern horizon',
    ],
    geologicalStory: 'Three volcanoes — Mount Erciyes at 3,917 meters still active, Mount Hasan at 3,253 meters, and Göllü Dag — erupted between 9 and 5 million years ago, layering the region with ignimbrite and volcanic tuff up to 150 meters thick. Over the past 10 million years, selective erosion by wind and rain carved the soft tuff while harder basalt caps protected columns beneath. This is how the fairy chimneys, some over 40 meters tall, came to exist. The region covers over 300 square kilometers of this unique landscape, found nowhere else on Earth at this scale.',
    culturalLayers: [
      'Hittite and Phrygian traces from 2000 to 1000 BCE — rock-cut steps and inscriptions',
      'Early Christian hermits arriving 4th century CE seeking desert-like solitude',
      'Byzantine monasteries 9th to 11th century with frescoes painted by artists trained in Constantinople',
      'Seljuk caravanserais connecting the Silk Road to Mediterranean ports',
      'Ottoman rural villages blending Muslim and Christian traditions side by side',
      'UNESCO World Heritage Site inscription in 1985',
      'Over 3,000 rock-cut churches documented across the region',
    ],
    hiddenGems: [
      'Underground cities Kaymakli and Derinkuyu connected by 9 kilometers of tunnels, sheltering up to 20,000 people during Arab raids',
      'Pigeon houses carved into cliffs for centuries, droppings used as nitrogen-rich fertilizer for vineyards',
      'Troglodyte families lived in these caves until the government relocated them in 1952 after a fatal rockfall in Zelve',
      'Cave wineries in Avanos still aging wine in clay amphorae buried underground for temperature control',
      'The El Nazar church contains frescoes painted by artists trained in Constantinople during the 10th century',
      'The Turkish word for fairy chimney is peri bacası, meaning fairy chimney — peri means fairy',
      'Wind erosion rates in Cappadocia are approximately one to two centimeters per century',
      'The rocky region was once an inland sea before the volcanic eruptions',
    ],
    localLegends: [
      'Camel Rock in Devrent Valley is said to guard caravans traveling along the ancient Silk Road',
      'Love Valley takes its name from a legend of two young lovers from rival villages meeting in secret among the tall chimneys',
      'The villagers of Cavusin abandoned their cliff homes in the 1950s after a large rockfall destroyed part of the settlement',
      'The three-capped fairy chimneys of Pasabag were believed to be dwellings of monks imitating Saint Simeon Stylites, who lived atop a pillar for 37 years',
      'Local shepherds still call the valleys by older Greek names passed down from Byzantine residents',
    ],
  },
  'Soganli Valley': {
    regionName: 'Southern Cappadocia — Soganli Basin',
    visibleValleys: [
      { name: 'Upper Soganli Valley', description: 'Painted Byzantine churches carved directly into volcanic cones' },
      { name: 'Lower Soganli Valley', description: 'Farming village floor, traditional doll-making tradition' },
      { name: 'Keşlik Valley', description: 'Adjacent monastery valley with preserved Byzantine frescoes' },
    ],
    visibleLandmarks: [
      'Keşlik Monastery complex — 13th century Byzantine monastic center with well-preserved frescoes',
      'Mazı Underground City — less touristed than Derinkuyu, equally deep',
      'Karabaş (Black Head) Church — named for a painted figure on its dome',
      'Yılanlı (Snake) Church — fresco of Saint George slaying a serpent',
      'Mount Hasan (3,253m) on the western horizon',
      'Apple and walnut orchards lining the valley floor',
    ],
    geologicalStory: 'Soganli shares the same volcanic origins as central Cappadocia — Mount Erciyes, Mount Hasan, and Göllü Dag eruptions between 9 and 5 million years ago deposited ignimbrite across this region too. However, Soganli has distinctive formations: shorter, more rounded cones with softer tuff that created hat-shaped hoodoos. The valley floor is wider and more fertile than Goreme, which is why agriculture flourished here for centuries. Walnut groves and apple orchards thrive in the warm microclimate, and the soil retains moisture thanks to the surrounding ridges.',
    culturalLayers: [
      'Byzantine monastic center from the 9th century, peaking in the 10th and 11th centuries',
      'Refuge for Christians during Arab raids between 7th and 9th centuries',
      'Seljuk-era village settlement continuing Christian and Muslim coexistence',
      'Famous today for handmade Soganli rag dolls, a living tradition passed from mother to daughter for over 100 years',
      'Over 150 rock-cut churches documented in the two Soganli valleys',
    ],
    hiddenGems: [
      'Soganli dolls are crafted from fabric scraps by village women, and the tradition is recognized as cultural heritage',
      'The Church of the Snake earned its name from a vivid fresco depicting Saint George slaying a serpent',
      'Most of the 150 rock-cut churches are accessible only by foot trails, protecting their frescoes from mass tourism',
      'The village apple harvest in September fills the valley with a rich aroma that draws visitors',
      'Mazı Underground City is believed to be connected to Derinkuyu through lost ancient tunnels',
      'Local women teach doll-making to girls as part of their dowry tradition',
    ],
    localLegends: [
      'Local women pass down doll-making patterns as dowry inheritance from generation to generation',
      'The monks of Keşlik Monastery are said to have sung so powerfully that their voices echoed across the region to Mount Hasan',
      'A hidden church in Upper Soganli is said to contain a secret underground chamber used during Arab raids',
    ],
  },
  'Ihlara Valley': {
    regionName: 'Western Cappadocia — Aksaray Plains',
    visibleValleys: [
      { name: 'Ihlara Canyon', description: 'Fourteen-kilometer river canyon 100 meters deep, carved by the Melendiz River' },
      { name: 'Peristrema Gorge', description: 'Byzantine monastic refuge, upper section of the canyon' },
      { name: 'Selime Valley', description: 'Wider basin with Cathedral rock formation at its mouth' },
    ],
    visibleLandmarks: [
      'Selime Cathedral — the largest rock-cut church in all of Cappadocia',
      'Belisirma village — canyon floor settlement with riverside restaurants',
      'Melendiz River — year-round flow rare in central Anatolia',
      'Mount Hasan (3,253m extinct volcano) dominating the horizon',
      'Aksaray plains stretching west toward Salt Lake',
      'Over 100 rock-cut Byzantine churches along the canyon walls',
    ],
    geologicalStory: 'Ihlara Valley is carved by the Melendiz River through ignimbrite layers deposited by Mount Hasan and Göllü Dag eruptions 5 to 9 million years ago. Unlike central Cappadocia\'s open cone landscape, Ihlara is a deep canyon — 100 meters below the plateau and 14 kilometers long. The river created a cool, green microclimate in the otherwise arid Anatolian steppe. The canyon walls expose millions of years of volcanic layers in visible bands of color, from white tuff to reddish basalt to greenish andesite.',
    culturalLayers: [
      'Christian refuge during Arab raids from the 7th century onward',
      'Byzantine monastic network with over 100 rock-cut churches carved into canyon walls',
      'Seljuk conquest in the 11th century, but churches continued under Seljuk tolerance',
      'Ottoman village settlement at Belisirma continues to this day',
      'The Melendiz River has supplied fresh water to monasteries and villages for over a thousand years',
    ],
    hiddenGems: [
      'Ağaçaltı Church contains painted scenes rarely seen elsewhere in Byzantine art, including unique depictions of Old Testament stories',
      'Sumbullu Church features a ceiling painted with stars in cobalt blue, a pigment imported from Afghanistan along the Silk Road',
      'The Melendiz River still flows year-round, a rarity in central Anatolia where most rivers run dry in summer',
      'Selime Cathedral inspired Star Wars Tatooine scenes according to fan theories, though Lucas has never confirmed this',
      'The canyon hosts over 80 species of plants unique to this microclimate',
      'Villagers of Belisirma claim the canyon water has healing properties for stomach ailments',
    ],
    localLegends: [
      'Villagers of Belisirma claim the canyon water cures stomach ailments when drunk directly from the river',
      'The canyon was called Peristrema by Byzantines, meaning the place of calm or the stopping place',
      'A hermit is said to have lived alone in one of the caves for forty years, leaving food offerings for passing travelers',
      'Saint George is said to have rested in the canyon before his final journey',
    ],
  },
  'Cat Valley': {
    regionName: 'Northern Cappadocia — Fork Valley',
    visibleValleys: [
      { name: 'Cat Valley (Fork Valley)', description: 'Branching network of diverging ridges, quieter alternative to Goreme' },
      { name: 'Kızılçukur (Red Hollow)', description: 'Red iron-rich cliffs especially vivid at sunset' },
      { name: 'Üzengi Valley', description: 'Stirrup Valley with agricultural terraces' },
      { name: 'Nar Valley', description: 'Pomegranate Valley with access to Nar crater lake' },
    ],
    visibleLandmarks: [
      'Ortahisar Castle — dramatic rock citadel rising from the village center',
      'Nar Lake — crater lake inside an extinct volcano',
      'Agricultural plains around Nevşehir city to the west',
      'Distinctive color-banded cliffs showing successive volcanic eruptions',
      'Vineyards and apple orchards on the valley floor',
    ],
    geologicalStory: 'Cat Valley — also called Fork Valley — is a branching network of smaller canyons cut by seasonal streams. The ridges here are sharper and narrower than Goreme\'s, and the volcanic layers show distinct color bands — yellows, reds, whites — revealing successive eruption events from Mount Erciyes and Göllü Dag over millions of years. Nar Lake, visible during flights, sits inside an extinct volcanic crater filled with mineral-rich water. The agricultural plains around this area support some of the best wine-grape vineyards in Turkey.',
    culturalLayers: [
      'Rural agricultural valley with ancient stone terraces still in use',
      'Vineyard tradition dating back to the Byzantine era',
      'Ortahisar castle was actively lived in as a fortified village until the 1950s',
      'Quieter and less touristed than Goreme, preserving traditional village life',
      'Local grape varieties include Emir and Kalecik Karası, used in renowned Cappadocian wines',
    ],
    hiddenGems: [
      'Nar Lake is a crater lake inside an extinct volcano, and locals believe its mineral-rich waters have healing properties for skin conditions',
      'Ortahisar Castle caves have been used for centuries as lemon storage — natural refrigeration that keeps citrus fresh for months',
      'Cat Valley gets its Turkish name from cat-ear shaped ridges visible from above',
      'Local winemakers use caves for aging, with consistent year-round temperatures around 12 degrees Celsius',
      'Ancient stone terraces on Cat Valley hillsides are still cultivated by local families',
    ],
    localLegends: [
      'Locals say Ortahisar castle caves protected villagers from Mongol raiders for centuries',
      'Nar Lake is said to have appeared overnight after a dragon was slain by a local hero',
      'A legend says the valley got its cat-ear ridges when a giant cat leapt across the Anatolian plateau',
    ],
  },
};

/**
 * Build a rich context string from selected flight areas.
 * Call this with the user's selected valleys to inject deep knowledge into prompts.
 */
export function buildFlightContext(selectedValleys: string[]): string {
  const areas = selectedValleys
    .map((v) => FLIGHT_AREAS[v])
    .filter(Boolean);

  if (areas.length === 0) return '';

  const dedupe = (arr: string[]) => Array.from(new Set(arr));

  const visibleValleysRaw = areas.flatMap((a) =>
    a.visibleValleys.map((v) => `${v.name} — ${v.description}`)
  );
  const visibleValleys = dedupe(visibleValleysRaw);
  const visibleLandmarks = dedupe(areas.flatMap((a) => a.visibleLandmarks));
  const geologicalStories = areas.map((a) => a.geologicalStory).join('\n\n');
  const culturalLayers = dedupe(areas.flatMap((a) => a.culturalLayers));
  const hiddenGems = dedupe(areas.flatMap((a) => a.hiddenGems));
  const localLegends = dedupe(areas.flatMap((a) => a.localLegends));

  return `
FLIGHT AREA KNOWLEDGE BASE (use this to write authoritative, rich, deep content):

Region: ${areas.map((a) => a.regionName).join(' + ')}

VISIBLE VALLEYS DURING FLIGHT — tourists will see these valleys from the balloon, the guide MUST cover ALL of them with distinct identity:
${visibleValleys.map((v) => `- ${v}`).join('\n')}

VISIBLE LANDMARKS — these will be seen during the flight:
${visibleLandmarks.map((l) => `- ${l}`).join('\n')}

GEOLOGICAL STORY (specific, datable facts to weave into the narration):
${geologicalStories}

CULTURAL LAYERS (use selectively based on chunk focus):
${culturalLayers.map((c) => `- ${c}`).join('\n')}

HIDDEN GEMS — include at least 2-3 of these in the narration:
${hiddenGems.map((h) => `- ${h}`).join('\n')}

LOCAL LEGENDS — include at least 1-2 when relevant to chunk focus:
${localLegends.map((l) => `- ${l}`).join('\n')}
`.trim();
}

/**
 * Get a concise list of visible valleys/landmarks for a given selection.
 * Used for quick reference in plan section topics.
 */
export function getVisibleHighlights(selectedValleys: string[]): {
  valleys: string[];
  landmarks: string[];
} {
  const areas = selectedValleys.map((v) => FLIGHT_AREAS[v]).filter(Boolean);
  const valleys = Array.from(new Set(areas.flatMap((a) => a.visibleValleys.map((v) => v.name))));
  const landmarks = Array.from(new Set(areas.flatMap((a) => a.visibleLandmarks.map((l) => l.split('—')[0].trim()))));
  return { valleys, landmarks };
}
