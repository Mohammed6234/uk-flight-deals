export function airportDisplay(code: string): string {
  const c = code.toUpperCase();
  const names: Record<string, string> = {
    LHR: 'London Heathrow',
    LGW: 'London Gatwick',
    LCY: 'London City',
    LTN: 'London Luton',
    STN: 'London Stansted',
    SEN: 'London Southend',
    MAN: 'Manchester',
    BHX: 'Birmingham',
    EDI: 'Edinburgh',
    GLA: 'Glasgow',
    ABZ: 'Aberdeen',
    INV: 'Inverness',
    NCL: 'Newcastle',
    LPL: 'Liverpool',
    BRS: 'Bristol',
    BOH: 'Bournemouth',
    SOU: 'Southampton',
    EMA: 'East Midlands',
    EXT: 'Exeter',
    CWL: 'Cardiff',
    BFS: 'Belfast International',
    BHD: 'Belfast City',
    DSA: 'Doncaster Sheffield',
  };
  return names[c] ?? c;
}

// Local static images should be placed in `public/Pic/` with filenames like `LHR.jpg`
export function imagePathForIata(code: string): string {
  return `/Pic/${code.toUpperCase()}.jpg`;
}

