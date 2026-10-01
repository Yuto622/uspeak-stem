// What stands on each island, built with the island kit's tools. One function per
// island; the kit lays the ground, the jetty, the paths and the greenery.

function stationsAndPaths({ island, path, resident, scatter, bench, flowers, lamp }, flowerColor = 0xf0d98a) {
  for (const sp of island.spots) path(sp.path.x, sp.path.z, sp.x, sp.z + 4.2);
  path(0, 19, 0, 12);
  for (const sp of island.spots) resident(sp);
  for (const [x, z] of [[-9, 6], [9, 6], [-24, 8], [24, 8]]) flowers(x, z, flowerColor);
  bench(-5, 14, Math.PI); bench(5, 14, Math.PI);
  for (const sx of [-5, 5]) lamp(sx, 10);
  scatter(island, 100);
}

export const BUILDERS = {
  cosmos(k) {
    const { island, B, D, house, fence, bunting, lamp, obstacles } = k;
    const [hill, pad, obs] = island.spots;
    for (let i = 0; i < 4; i++) D(hill.x, 0.3 + i * 0.5, hill.z - 3, 9 - i * 1.8, 0.5, 7 - i * 1.4, i % 2 ? 0x8fb061 : 0x9cbb6a);
    D(hill.x, 3.2, hill.z - 3, 0.3, 2.4, 0.3, 0x6f5b3e);
    B(hill.x, 4.6, hill.z - 3, 1.3, 1.3, 1.3, 0x3f7fd0);
    const moon = B(hill.x + 3, 5.2, hill.z - 3, 0.7, 0.7, 0.7, 0xe6e2d6); moon.userData.orbit = { cx: hill.x, cz: hill.z - 3, r: 3.2 }; island._moon = moon;
    obstacles.push({ x: hill.x, z: hill.z - 3, w: 4, d: 3 });
    house(hill.x, hill.z - 10, 5, 4.5, 0xe8dcc0, 0x6b8fb8, { en: hill.en, ja: hill.name });
    D(pad.x, 0.3, pad.z - 4, 9, 0.3, 9, 0x8a8f99); D(pad.x, 0.5, pad.z - 4, 7.5, 0.2, 7.5, 0x9aa0aa);
    D(pad.x + 2.4, 4.8, pad.z - 4, 1.0, 9, 1.0, 0xc9cdd6); D(pad.x + 1.4, 7.5, pad.z - 4, 1.6, 0.3, 0.6, 0xc9cdd6);
    D(pad.x, 2.4, pad.z - 4, 1.4, 4, 1.4, 0xf2f2f2); D(pad.x, 5.2, pad.z - 4, 1.0, 1.6, 1.0, 0xf2f2f2); D(pad.x, 6.4, pad.z - 4, 0.6, 0.9, 0.6, 0xd04030);
    for (const [fx, fz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) D(pad.x + fx * 0.9, 0.9, pad.z - 4 + fz * 0.9, fx ? 0.8 : 0.3, 1.2, fz ? 0.8 : 0.3, 0xd04030);
    obstacles.push({ x: pad.x, z: pad.z - 4, w: 4, d: 4 });
    fence(pad.x - 6, pad.z - 9.5, 9); bunting(pad.x - 6, pad.z + 1, pad.x + 6, pad.z + 1, 4);
    house(pad.x - 11, pad.z - 2, 5, 4.5, 0xe3e9f0, 0x5c8583, { en: 'Mission Control', ja: 'かんせいしつ' });
    for (let i = 0; i < 6; i++) D(obs.x, 0.5 + i, obs.z - 4, 6.4 - (i > 4 ? 0.6 : 0), 1, 6.4 - (i > 4 ? 0.6 : 0), i % 2 ? 0xe8e2d0 : 0xdcd4c0);
    for (let i = 0; i < 4; i++) D(obs.x, 6.6 + i * 0.7, obs.z - 4, 6.2 - i * 1.4, 0.7, 6.2 - i * 1.4, 0xb9c6d6);
    D(obs.x + 0.8, 8.6, obs.z - 4.4, 0.8, 0.8, 3.2, 0x334455); D(obs.x, 1.5, obs.z - 0.9, 1.4, 2.6, 0.3, 0x50412f);
    obstacles.push({ x: obs.x, z: obs.z - 4, w: 3.6, d: 3.6 });
    for (const sx of [-5, 5]) lamp(obs.x + sx, obs.z + 1);
    stationsAndPaths(k);
  },

  lab(k) {
    const { island, D, house, crate, barrel, fence, obstacles } = k;
    const [bench_, shelf, corner] = island.spots;
    D(bench_.x, 1.0, bench_.z - 4, 7, 0.3, 2.4, 0xa58c62);
    for (const sx of [-3.2, 3.2]) for (const sz of [-1, 1]) D(bench_.x + sx, 0.5, bench_.z - 4 + sz, 0.3, 1, 0.3, 0x7b6647);
    [0x7fd1ff, 0xd9c4ff, 0xf6f1c8, 0xa9f0d1].forEach((c, i) => { D(bench_.x - 2.4 + i * 1.6, 1.6, bench_.z - 4, 0.7, 0.9, 0.7, 0xe8f2f5); D(bench_.x - 2.4 + i * 1.6, 1.45, bench_.z - 4, 0.6, 0.5, 0.6, c); });
    for (const sx of [-3.6, 3.6]) D(bench_.x + sx, 2.6, bench_.z - 5.2, 0.25, 3.2, 0.25, 0x6f5b3e);
    D(bench_.x, 4.2, bench_.z - 4.4, 8.4, 0.2, 3.6, 0xb86e46);
    obstacles.push({ x: bench_.x, z: bench_.z - 4, w: 3.8, d: 1.6 });
    house(bench_.x, bench_.z - 11, 6, 5, 0xf0e6cc, 0xb86e46, { en: bench_.en, ja: bench_.name });
    D(shelf.x, 2.0, shelf.z - 4, 7, 4, 1.4, 0x8a6a45);
    const tints = [0xd9433a, 0xe98ab0, 0x7a4ea8, 0x3a6fd0, 0x3f9a52, 0xe4c239];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) D(shelf.x - 2.5 + i, 0.9 + row * 1.2, shelf.z - 3.2, 0.5, 0.8, 0.5, tints[(i + row) % 6]);
    D(shelf.x, 4.1, shelf.z - 4, 7.4, 0.2, 1.8, 0x6d543a);
    obstacles.push({ x: shelf.x, z: shelf.z - 4, w: 3.7, d: 0.9 });
    house(shelf.x - 11, shelf.z - 2, 5.5, 4.5, 0xdde6d2, 0x5c8583, { en: 'Stockroom', ja: 'やくひんしつ' });
    crate(shelf.x + 6, shelf.z - 3); barrel(shelf.x + 7.4, shelf.z - 3);
    D(corner.x, 0.4, corner.z - 4, 5, 0.6, 5, 0x9a9585);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; D(corner.x + Math.cos(a) * 2, 0.9, corner.z - 4 + Math.sin(a) * 2, 0.6, 0.5, 0.6, 0x8c917c); }
    D(corner.x, 1.2, corner.z - 4, 0.4, 1.0, 0.4, 0xfff4d7); D(corner.x, 1.9, corner.z - 4, 0.3, 0.4, 0.3, 0xffc66a, 2.2); D(corner.x, 1.7, corner.z - 4, 1.6, 2.2, 1.6, 0xd8ecf2);
    obstacles.push({ x: corner.x, z: corner.z - 4, w: 2.6, d: 2.6 });
    fence(corner.x - 4, corner.z - 8, 6);
    house(corner.x, corner.z - 11, 5, 4.5, 0xe6d8c8, 0x8e795f, { en: corner.en, ja: corner.name });
    stationsAndPaths(k, 0xe89bb0);
  },

  force(k) {
    const { island, D, B, house, fence, obstacles } = k;
    const [frame, ramp, seesaw] = island.spots;
    // Swing frame: two tall posts, a bar, a bob on a rope.
    for (const sx of [-2.5, 2.5]) D(frame.x + sx, 3, frame.z - 4, 0.4, 6, 0.4, 0x6f5b3e);
    D(frame.x, 6.1, frame.z - 4, 5.6, 0.4, 0.4, 0x6f5b3e);
    D(frame.x, 3.6, frame.z - 4, 0.06, 4.6, 0.06, 0xd4c49b);
    const bob = B(frame.x, 1.2, frame.z - 4, 0.8, 0.8, 0.8, 0x8d9aa0); bob.userData.swing = { cx: frame.x, cz: frame.z - 4, top: 6, len: 4.8 }; island._bob = bob;
    obstacles.push({ x: frame.x, z: frame.z - 4, w: 3, d: 1 });
    house(frame.x, frame.z - 11, 5, 4.5, 0xe8dcc0, 0x8e795f, { en: frame.en, ja: frame.name });
    // Slide ramp: a wedge of boxes rising to a platform, a box at the top.
    for (let i = 0; i < 8; i++) D(ramp.x - 3.5 + i, 0.3 + i * 0.3, ramp.z - 4, 1, 0.6 + i * 0.6, 3, i % 2 ? 0xc9b48a : 0xbda77c);
    D(ramp.x + 4.5, 2.7, ramp.z - 4, 1.2, 5.4, 3, 0x8a7350); D(ramp.x + 4.5, 5.6, ramp.z - 4, 1.6, 0.3, 3.4, 0xa58c62);
    D(ramp.x + 4.5, 6.2, ramp.z - 4, 0.9, 0.9, 0.9, 0xd04030);
    obstacles.push({ x: ramp.x + 0.5, z: ramp.z - 4, w: 5, d: 1.7 });
    fence(ramp.x - 5, ramp.z - 7.5, 8);
    house(ramp.x - 11, ramp.z - 2, 5, 4.5, 0xe3e9f0, 0x5c8583, { en: 'Workshop', ja: 'さぎょうしつ' });
    // Seesaw: a plank on a fulcrum, two weights.
    D(seesaw.x, 0.6, seesaw.z - 4, 1.2, 1.2, 1.2, 0x7b6647);
    const plank = B(seesaw.x, 1.35, seesaw.z - 4, 7, 0.25, 1.2, 0xa58c62); plank.rotation.z = -0.18; island._plank = plank;
    D(seesaw.x - 3, 2.3, seesaw.z - 4, 1.1, 1.1, 1.1, 0x3a6fd0); D(seesaw.x + 3, 1.0, seesaw.z - 4, 0.8, 0.8, 0.8, 0xd04030);
    obstacles.push({ x: seesaw.x, z: seesaw.z - 4, w: 3.8, d: 1 });
    house(seesaw.x, seesaw.z - 11, 5, 4.5, 0xe6d8c8, 0x6b8fb8, { en: seesaw.en, ja: seesaw.name });
    stationsAndPaths(k, 0xe7b06a);
  },

  life(k) {
    const { island, D, house, fence, tree, bush, obstacles, rand } = k;
    const [meadow, sill, track] = island.spots;
    // Rabbit meadow: a fenced paddock with rabbits and a fox.
    fence(meadow.x - 5, meadow.z - 8.5, 7); fence(meadow.x - 5, meadow.z - 8.5, 5, 'z'); fence(meadow.x + 4, meadow.z - 8.5, 5, 'z');
    for (let i = 0; i < 7; i++) { const x = meadow.x - 4 + rand() * 8; const z = meadow.z - 8 + rand() * 5; D(x, 0.5, z, 0.5, 0.5, 0.7, 0xf4f1ea); D(x, 0.95, z + 0.2, 0.3, 0.5, 0.15, 0xf4f1ea); }
    D(meadow.x + 2.5, 0.6, meadow.z - 3, 0.6, 0.6, 1.2, 0xd4713d); D(meadow.x + 2.5, 1.0, meadow.z - 2.3, 0.5, 0.4, 0.5, 0xd4713d);
    obstacles.push({ x: meadow.x, z: meadow.z - 6, w: 4.6, d: 2.6 });
    house(meadow.x, meadow.z - 13, 5, 4.5, 0xe8dcc0, 0x8e795f, { en: meadow.en, ja: meadow.name });
    // Greenhouse: glass walls, pots inside.
    D(sill.x, 2.0, sill.z - 4, 7, 3.6, 5, 0xd8ecf2); D(sill.x, 4.1, sill.z - 4, 7.6, 0.4, 5.6, 0xffffff);
    for (const sx of [-3.5, 3.5]) for (const sz of [-2.5, 2.5]) D(sill.x + sx, 2.0, sill.z - 4 + sz, 0.3, 3.8, 0.3, 0xffffff);
    for (let i = 0; i < 4; i++) { D(sill.x - 2.2 + i * 1.5, 0.5, sill.z - 4, 0.8, 0.8, 0.8, 0xb86e46); D(sill.x - 2.2 + i * 1.5, 1.2 + i * 0.2, sill.z - 4, 0.12, 0.6 + i * 0.4, 0.12, 0x4f8f4a); D(sill.x - 2.2 + i * 1.5, 1.5 + i * 0.4, sill.z - 4, 0.6, 0.2, 0.4, 0x6fb55a); }
    obstacles.push({ x: sill.x, z: sill.z - 4, w: 3.7, d: 2.7 });
    house(sill.x - 11, sill.z - 2, 5, 4.5, 0xdde6d2, 0x5c8583, { en: 'Potting Shed', ja: 'うえきの こや' });
    // Running track: an oval of red track around a lawn.
    for (let a = 0; a < Math.PI * 2; a += 0.18) D(track.x + Math.cos(a) * 5, 0.18, track.z - 4 + Math.sin(a) * 3.2, 1.3, 0.12, 1.3, 0xc0604a);
    D(track.x, 1.4, track.z - 7.5, 0.2, 2.6, 0.2, 0xffffff); D(track.x, 2.6, track.z - 7.5, 1.4, 0.6, 0.1, 0xd04030);
    house(track.x, track.z - 12, 5, 4.5, 0xe6d8c8, 0x6b8fb8, { en: track.en, ja: track.name });
    tree(meadow.x - 8, meadow.z - 12, 1.2, 0); bush(sill.x + 6, sill.z - 1);
    stationsAndPaths(k, 0xe89bb0);
  },

  earth(k) {
    const { island, D, B, house, rock, obstacles } = k;
    const [seismo, harbour, tower] = island.spots;
    // Seismograph house: a house with a drum and a needle out front.
    house(seismo.x, seismo.z - 9, 6, 5, 0xe8dcc0, 0x8e795f, { en: seismo.en, ja: seismo.name });
    D(seismo.x, 0.8, seismo.z - 4, 2.6, 1.2, 1.4, 0x8a7350); D(seismo.x - 0.5, 1.9, seismo.z - 4, 1.4, 1.0, 1.0, 0xf4f1ea);
    D(seismo.x + 1.0, 2.2, seismo.z - 4, 0.08, 1.4, 0.08, 0x334455);
    obstacles.push({ x: seismo.x, z: seismo.z - 4, w: 1.6, d: 1 });
    for (let i = 0; i < 3; i++) rock(seismo.x - 5 + i * 1.6, seismo.z - 1, 0.6 + i * 0.2);
    // Harbour wall: a stone wall with a lighthouse and a sea-level mark.
    for (let i = 0; i < 9; i++) D(harbour.x - 4 + i, 0.9 + (i % 2) * 0.1, harbour.z - 5, 1, 1.8, 1.2, i % 2 ? 0x8d9aa0 : 0x9a9585);
    D(harbour.x, 2.6, harbour.z - 5, 1.6, 4, 1.6, 0xf2f2f2); D(harbour.x, 4.9, harbour.z - 5, 1.9, 0.6, 1.9, 0xd04030); D(harbour.x, 5.5, harbour.z - 5, 1.2, 0.8, 1.2, 0xffe6ad, 2);
    obstacles.push({ x: harbour.x, z: harbour.z - 5, w: 4.6, d: 0.9 });
    house(harbour.x - 11, harbour.z - 2, 5, 4.5, 0xe3e9f0, 0x5c8583, { en: 'Tide Office', ja: 'しおの じむしょ' });
    // Weather tower: a lattice tower with a vane and a cloud over it.
    for (let i = 0; i < 5; i++) D(tower.x, 1 + i * 1.6, tower.z - 4, 2.2 - i * 0.3, 1.6, 2.2 - i * 0.3, i % 2 ? 0x8d9aa0 : 0x9aa0aa);
    D(tower.x, 9.3, tower.z - 4, 0.1, 1.4, 0.1, 0x334455); D(tower.x + 0.4, 9.8, tower.z - 4, 0.9, 0.12, 0.1, 0xd04030);
    const cloud = B(tower.x, 12.5, tower.z - 4, 3.4, 1.2, 2.2, 0xffffff); island._cloud = cloud;
    obstacles.push({ x: tower.x, z: tower.z - 4, w: 1.3, d: 1.3 });
    house(tower.x, tower.z - 11, 5, 4.5, 0xe6d8c8, 0x6b8fb8, { en: tower.en, ja: tower.name });
    stationsAndPaths(k, 0xdfe4ef);
  },

  maker(k) {
    const { island, D, B, house, crate, barrel, fence, obstacles } = k;
    const [yard, shed, mill] = island.spots;
    // Bridge yard: two stone piers with a plank, a crate on it.
    for (const sx of [-3, 3]) D(yard.x + sx, 0.9, yard.z - 4, 1.4, 1.8, 2, 0x9a9585);
    D(yard.x, 1.85, yard.z - 4, 7.2, 0.3, 1.4, 0xa58c62); crate(yard.x, yard.z - 4, 0.9);
    obstacles.push({ x: yard.x, z: yard.z - 4, w: 3.8, d: 1 });
    for (let i = 0; i < 3; i++) D(yard.x - 6 + i * 0.9, 0.3 + i * 0.3, yard.z - 8, 0.4, 0.6 + i * 0.6, 3, 0xb08655);
    house(yard.x, yard.z - 12, 6, 5, 0xe8dcc0, 0x8e795f, { en: yard.en, ja: yard.name });
    // Circuit shed: a shed with a big battery and a bulb over the door.
    house(shed.x, shed.z - 9, 6, 5, 0xe3e9f0, 0x5c8583, { en: shed.en, ja: shed.name });
    D(shed.x - 3.5, 1.0, shed.z - 4, 1.4, 2.0, 1.0, 0x334455); D(shed.x - 3.5, 2.2, shed.z - 4, 0.5, 0.4, 0.5, 0xd4c49b);
    D(shed.x, 7.6, shed.z - 6.4, 0.7, 0.7, 0.7, 0xffe6ad, 2.4);
    obstacles.push({ x: shed.x - 3.5, z: shed.z - 4, w: 0.9, d: 0.7 });
    barrel(shed.x + 4, shed.z - 4);
    // Gear mill: a mill with two big gears on the wall and a water wheel.
    house(mill.x, mill.z - 9, 6, 5, 0xe6d8c8, 0x6b8fb8, { en: mill.en, ja: mill.name });
    const g1 = B(mill.x - 2.2, 4.2, mill.z - 6.2, 2.4, 2.4, 0.4, 0xb08655); const g2 = B(mill.x + 0.6, 4.2, mill.z - 6.2, 1.6, 1.6, 0.4, 0xd4c49b);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; D(mill.x - 2.2 + Math.cos(a) * 1.35, 4.2 + Math.sin(a) * 1.35, mill.z - 6.2, 0.4, 0.4, 0.4, 0xb08655); }
    island._gears = [g1, g2];
    const wheel = B(mill.x + 4.6, 2, mill.z - 4, 0.4, 3.6, 3.6, 0x8a7350); island._wheel = wheel;
    obstacles.push({ x: mill.x + 4.6, z: mill.z - 4, w: 0.6, d: 2 });
    fence(mill.x - 5, mill.z - 1, 4);
    stationsAndPaths(k, 0xe7b06a);
  },

  data(k) {
    const { island, D, B, house, fence, obstacles, rand } = k;
    const [table, pond, machine] = island.spots;
    // Dice table: a green table with giant dice.
    D(table.x, 1.0, table.z - 4, 5, 0.3, 3.4, 0x3f7a52); for (const sx of [-2.2, 2.2]) for (const sz of [-1.4, 1.4]) D(table.x + sx, 0.5, table.z - 4 + sz, 0.3, 1, 0.3, 0x7b6647);
    const d1 = B(table.x - 1, 1.75, table.z - 4, 1.2, 1.2, 1.2, 0xf4f1ea); const d2 = B(table.x + 1.2, 1.75, table.z - 4.5, 1.2, 1.2, 1.2, 0xf4f1ea); d2.rotation.y = 0.6;
    for (const d of [d1, d2]) for (const [px, py] of [[-0.3, 0.3], [0, 0], [0.3, -0.3]]) D(d.position.x + px, d.position.y + py, d.position.z + 0.62, 0.18, 0.18, 0.05, 0x1c2a3a);
    obstacles.push({ x: table.x, z: table.z - 4, w: 2.7, d: 1.9 });
    house(table.x, table.z - 11, 5, 4.5, 0xe8dcc0, 0x8e795f, { en: table.en, ja: table.name });
    // Counting pond: a pond with fish and a net.
    for (let i = 0; i < 3; i++) D(pond.x, 0.12 + i * 0.03, pond.z - 4, 9 - i * 1.5, 0.1, 6 - i, i === 2 ? 0x4b8090 : i ? 0x5a96a4 : 0xd9c38a);
    for (let i = 0; i < 9; i++) { const x = pond.x - 3 + rand() * 6; const z = pond.z - 6 + rand() * 4; D(x, 0.3, z, 0.5, 0.15, 0.25, i % 3 ? 0xf2b134 : 0xd04030); }
    D(pond.x + 5, 1.4, pond.z - 2, 0.1, 2.8, 0.1, 0x8a7350); D(pond.x + 5.4, 2.6, pond.z - 2, 0.9, 0.6, 0.9, 0xd8ecf2);
    obstacles.push({ x: pond.x, z: pond.z - 4, w: 4.6, d: 3.1 });
    house(pond.x - 11, pond.z - 2, 5, 4.5, 0xe3e9f0, 0x5c8583, { en: 'Tally Hut', ja: 'かぞえ ごや' });
    // Sorting machine: a conveyor with fruit and two bins.
    D(machine.x, 1.0, machine.z - 4, 8, 0.3, 1.4, 0x334455); for (const sx of [-3.5, 3.5]) D(machine.x + sx, 0.5, machine.z - 4, 0.3, 1, 1.2, 0x8d9aa0);
    for (let i = 0; i < 5; i++) D(machine.x - 3 + i * 1.5, 1.45, machine.z - 4, 0.6, 0.6, 0.6, i % 2 ? 0xd9433a : 0xf2a034);
    D(machine.x - 1.2, 0.6, machine.z - 6.4, 1.6, 1.2, 1.6, 0xd9433a); D(machine.x + 1.2, 0.6, machine.z - 6.4, 1.6, 1.2, 1.6, 0xf2a034);
    D(machine.x, 2.6, machine.z - 4, 1.2, 1.2, 1.2, 0x8d9aa0); D(machine.x, 2.6, machine.z - 3.35, 0.6, 0.3, 0.1, 0x7fd1ff, 2);
    obstacles.push({ x: machine.x, z: machine.z - 4.6, w: 4.2, d: 1.6 });
    fence(machine.x - 4, machine.z - 8.5, 6);
    house(machine.x, machine.z - 12, 5, 4.5, 0xe6d8c8, 0x6b8fb8, { en: machine.en, ja: machine.name });
    stationsAndPaths(k, 0xdfe4ef);
  },
};

// Little motions on the islands: the Moon circling, the bob swinging, gears turning.
export function animateIslands(islands, time) {
  const c = islands.get('cosmos')?._moon; if (c) { const o = c.userData.orbit; c.position.x = o.cx + Math.cos(time * 0.6) * o.r; c.position.z = o.cz + Math.sin(time * 0.6) * o.r; }
  const bob = islands.get('force')?._bob; if (bob) { const s = bob.userData.swing; const a = Math.sin(time * 1.4) * 0.5; bob.position.x = s.cx + Math.sin(a) * s.len; bob.position.y = s.top - Math.cos(a) * s.len; }
  const plank = islands.get('force')?._plank; if (plank) plank.rotation.z = Math.sin(time * 0.5) * 0.18;
  const gears = islands.get('maker')?._gears; if (gears) { gears[0].rotation.z = time * 0.8; gears[1].rotation.z = -time * 1.2; }
  const wheel = islands.get('maker')?._wheel; if (wheel) wheel.rotation.x = time * 0.7;
  const cloud = islands.get('earth')?._cloud; if (cloud) cloud.position.x += Math.sin(time * 0.3) * 0.002;
}
