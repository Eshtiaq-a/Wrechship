self.onmessage = function (e) {
  const { INCIDENTS, EMODNET_INCIDENTS } = e.data;
  
  const ALL_INCIDENTS = INCIDENTS.concat(EMODNET_INCIDENTS || []);
  
  const MONTH_MAP = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
    'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
  };
  
  function parseDate(raw) {
    const result = { year: null, month: null, day: null, iso: null, raw: raw || '' };
    if (!raw || raw === '' || raw === '-' || raw === 'Unknown') return result;

    const s = raw.trim();

    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      result.year = parseInt(isoMatch[1], 10);
      result.month = parseInt(isoMatch[2], 10);
      result.day = parseInt(isoMatch[3], 10);
      result.iso = s;
      return result;
    }

    const dmyMatch = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (dmyMatch) {
      const m = MONTH_MAP[dmyMatch[2].toLowerCase()];
      if (m) {
        result.day = parseInt(dmyMatch[1], 10);
        result.month = m;
        result.year = parseInt(dmyMatch[3], 10);
        result.iso = result.year + '-' + String(result.month).padStart(2, '0') + '-' + String(result.day).padStart(2, '0');
        return result;
      }
    }

    const orMatch = s.match(/^(\d{1,2})\s+or\s+\d{1,2}\s+([A-Za-z]+)\s+(\d{4})$/);
    if (orMatch) {
      const m = MONTH_MAP[orMatch[2].toLowerCase()];
      if (m) {
        result.day = parseInt(orMatch[1], 10);
        result.month = m;
        result.year = parseInt(orMatch[3], 10);
        result.iso = result.year + '-' + String(result.month).padStart(2, '0') + '-' + String(result.day).padStart(2, '0');
        return result;
      }
    }

    const usMatch = s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
    if (usMatch) {
      const m = MONTH_MAP[usMatch[1].toLowerCase()];
      if (m) {
        result.day = parseInt(usMatch[2], 10);
        result.month = m;
        result.year = parseInt(usMatch[3], 10);
        result.iso = result.year + '-' + String(result.month).padStart(2, '0') + '-' + String(result.day).padStart(2, '0');
        return result;
      }
    }

    const monthYearMatch = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (monthYearMatch) {
      const m = MONTH_MAP[monthYearMatch[1].toLowerCase()];
      if (m) {
        result.month = m;
        result.year = parseInt(monthYearMatch[2], 10);
        return result;
      }
    }

    const yearMatch = s.match(/^(\d{4})$/);
    if (yearMatch) {
      result.year = parseInt(yearMatch[1], 10);
      return result;
    }

    const anyYear = s.match(/\b(\d{4})\b/);
    if (anyYear) {
      result.year = parseInt(anyYear[1], 10);
    }

    return result;
  }
  
  const CLS_MIGRATION = { 'ferry': 'passenger_ferry', 'cargo': 'cargo_merchant', 'enviro': 'environmental' };
  const MILITARY_KEYWORDS = ['aircraft carrier', 'battleship', 'cruiser', 'destroyer', 'frigate', 'corvette', 'torpedo boat', 'minesweeper', 'mine sweeper', 'gunboat', 'patrol boat', 'troopship', 'troop ship', 'armed transport', 'war ', 'u-boat', 'U-boat', 'battle of', 'torpedoed by', 'sunk by'];
  const PASSENGER_KEYWORDS = ['passenger', 'cruise ship', 'river cruise', 'ocean liner', 'passenger liner', 'pleasure boat', 'ferry', 'hospital ship'];
  const ENVIRONMENTAL_KEYWORDS = ['oil spill', 'oil tanker', 'crude oil', 'environmental disaster', 'pollution', 'chemical tanker', 'toxic'];

  function inferCategory(inc) {
    const name = (inc.name || '').toLowerCase();
    const desc = (inc.desc || '').toLowerCase();
    const combined = name + ' ' + desc;

    if (name.includes('titan') && combined.includes('submersible')) return 'submersible';
    if (name.includes('titan') && combined.includes('oceangate')) return 'submersible';
    if (inc.cls === 'submarine') return 'submarine';
    if (MILITARY_KEYWORDS.some(kw => combined.includes(kw.toLowerCase()))) return 'military';
    if (ENVIRONMENTAL_KEYWORDS.some(kw => combined.includes(kw.toLowerCase()))) return 'environmental';
    if (PASSENGER_KEYWORDS.some(kw => combined.includes(kw.toLowerCase()))) return 'passenger_ferry';
    if (CLS_MIGRATION[inc.cls]) return CLS_MIGRATION[inc.cls];
    if (['military', 'passenger_ferry', 'submarine', 'submersible', 'cargo_merchant', 'environmental', 'other_maritime_incident', 'unknown'].includes(inc.cls)) return inc.cls;
    return 'cargo_merchant';
  }
  
  function inferIncidentType(inc) {
    const desc = (inc.desc || '').toLowerCase();
    const name = (inc.name || '').toLowerCase();
    const combined = name + ' ' + desc;

    if (combined.includes('implo')) return 'implosion';
    if (combined.includes('grounded') || combined.includes('grounding') || combined.includes('ran aground')) return 'grounding';
    if (combined.includes('capsiz')) return 'capsizing';
    if (combined.includes('fire') && !combined.includes('fired')) return 'fire';
    if (combined.includes('collision') || combined.includes('collided') || combined.includes('rammed')) return 'collision';
    if (combined.includes('scuttl')) return 'scuttling';
    if (combined.includes('torpedo')) return 'torpedoed';
    if (combined.includes('mine') && (combined.includes('struck a mine') || combined.includes('hit a mine') || combined.includes('mined'))) return 'mined';
    if (combined.includes('storm') || combined.includes('typhoon') || combined.includes('hurricane') || combined.includes('foundered')) return 'foundering';
    if (combined.includes('bomb') || combined.includes('air attack') || combined.includes('dive bomber')) return 'air_attack';
    return 'shipwreck';
  }
  
  // Normalize
  for (let i = 0; i < ALL_INCIDENTS.length; i++) {
    const inc = ALL_INCIDENTS[i];
    if (!inc.src || inc.src.length === 0 || inc.src[0] === "EMODnet") {
      inc.src = [`https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(inc.name)}+shipwreck`];
    }
    inc.dateInfo = parseDate(inc.date);
    inc.cls = inferCategory(inc);
    if (!inc.incidentType) {
      inc.incidentType = inferIncidentType(inc);
    }
    // Optimization: attach year directly to avoid getter calls during sort
    inc._year = inc.dateInfo && inc.dateInfo.year !== null ? inc.dateInfo.year : -Infinity;
    inc._iso = inc.dateInfo && inc.dateInfo.iso ? inc.dateInfo.iso : '';
  }
  
  const INCIDENTS_CLEAN = ALL_INCIDENTS.filter(i => i.desc && i.desc.length > 10);
  
  self.postMessage({ ALL_INCIDENTS, INCIDENTS_CLEAN });
};
