import { prisma } from '../src/lib/db';

async function main() {
  console.log('--- STARTING COMPLETE CATALOG RESET FROM EXACT PDF SPECIFICATION ---');

  // 1. Clean slate: remove all existing items, history, logs, and categories
  console.log('Cleaning old data...');
  await prisma.priceHistory.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();

  // Ensure default brand exists
  await prisma.brand.upsert({
    where: { name: 'J.K. Spares' },
    update: {},
    create: { name: 'J.K. Spares' },
  });

  // 2. Define Category Hierarchy with exact parent-child relations
  const categoriesData = [
    // 1. C.I. Submersible Parts
    {
      id: 'ci_parts',
      name: 'C.I. Submersible Parts',
      sortOrder: 1,
      children: [
        { id: 'v3_ci', name: 'V-3 C.I. Submersible Parts', sortOrder: 1 },
        { id: 'v4_ci', name: 'V-4 C.I. Submersible Parts', sortOrder: 2 },
        { id: 'v5_ci', name: 'V-5 C.I. Submersible Parts', sortOrder: 3 },
        { id: 'v6_ss_pump_parts', name: 'S.S. Pump Parts (V-6)', sortOrder: 4 },
        { id: 'deccan_parts', name: 'Deccan Type Parts', sortOrder: 5 },
      ],
    },
    // 2. Impellers (Openwell & Mono Block) - Both under common Impellers parent
    {
      id: 'impellers',
      name: 'Impellers (Openwell & Mono Block)',
      sortOrder: 2,
      children: [
        { id: 'openwell_impeller', name: 'Openwell Impeller', sortOrder: 1 },
        { id: 'monoblock_impeller', name: 'Mono Block Impeller', sortOrder: 2 },
      ],
    },
    // 3. Thrust Bearing Plate, SS Counter, Bearing Set
    {
      id: 'thrust_bearing_counter',
      name: 'Thrust Bearing, Counter & Bearing Set',
      sortOrder: 3,
      children: [
        { id: 'thrust_bearing_plate', name: 'Thrust Bearing Plate', sortOrder: 1 },
        { id: 'ss_counter', name: 'S.S. Counter', sortOrder: 2 },
        { id: 'bearing_set_premium', name: 'Bearing Set Premium', sortOrder: 3 },
      ],
    },
    // 4. L.B. Bush, Rubber Bush
    {
      id: 'lb_bush_rubber',
      name: 'L.B. Bush & Rubber Bush',
      sortOrder: 4,
      children: [
        { id: 'lb_bush', name: 'L.B. Bush', sortOrder: 1 },
        { id: 'raj_rubber_bush', name: 'Raj & Raj Rubber Bush', sortOrder: 2 },
        { id: 'tefcot_rubber_bush', name: 'Tefcot Rubber Bush', sortOrder: 3 },
        { id: 'dura_rubber_bush', name: 'Dura Rubber Bush', sortOrder: 4 },
      ],
    },
    // 5. Diffuser (Bowl) & Impeller
    {
      id: 'diffuser_impeller',
      name: 'Diffuser (Bowl) & Impeller',
      sortOrder: 5,
      children: [
        { id: 'v4_hf', name: 'V-4 HF (High Flow)', sortOrder: 1 },
        { id: 'v4_hh', name: 'V-4 HH (High Head)', sortOrder: 2 },
        { id: 'diffuser_accessory', name: 'Diffuser Bowl Accessory', sortOrder: 3 },
        { id: 'r_series_hh', name: 'R-Series HH (High Head)', sortOrder: 4 },
        { id: 'v3_hf', name: 'V-3 HF (High Flow)', sortOrder: 5 },
      ],
    },
    // 6. S.S. 410 Stud, Allan Cap, Hex Nut-Bolt, Washer
    {
      id: 'studs_bolts',
      name: 'Studs, Nuts, Bolts & Washers',
      sortOrder: 6,
      children: [
        { id: 'ss_410_stud', name: 'S.S. 410 Stud', sortOrder: 1 },
        { id: 'ss_hex_bolt', name: 'S.S. Hex Bolt (AISI 202)', sortOrder: 2 },
        { id: 'ss_allan_cap', name: 'S.S. Allan Cap (202)', sortOrder: 3 },
        { id: 'ss_hex_nut_washer', name: 'S.S. Hex Nut, Screw & Washer', sortOrder: 4 },
      ],
    },
    // 7. S.S. Sleeve & Couple
    {
      id: 'sleeve_couple',
      name: 'S.S. Sleeve & Couple',
      sortOrder: 7,
      children: [
        { id: 'v6_pump_sleeve', name: 'V-6 Pump Sleeve', sortOrder: 1 },
        { id: 'v6_motor_couple', name: 'V-6 Motor Couple', sortOrder: 2 },
        { id: 'v4_pump_sleeve', name: 'V-4 Pump Sleeve', sortOrder: 3 },
        { id: 'rotor_sleeve', name: 'Rotor Sleeve', sortOrder: 4 },
      ],
    },
    // 8. S.S. Key, S.S./C.I. Bowl & Impeller
    {
      id: 'key_bowls',
      name: 'S.S. Key, S.S./C.I. Bowl & Impeller',
      sortOrder: 8,
      children: [
        { id: 'ss_key_410', name: 'S.S. Key 410', sortOrder: 1 },
        { id: 'ss_bowl_impeller_set', name: 'S.S. Bowl & Impeller Set', sortOrder: 2 },
        { id: 'ci_bowl_pvc_impeller_set', name: 'C.I. Bowl & PVC Impeller Set', sortOrder: 3 },
      ],
    },
    // 9. S.S. Submersible Pump Parts
    {
      id: 'pump_parts',
      name: 'S.S. Submersible Pump Parts',
      sortOrder: 9,
      children: [
        { id: 'drain_plug', name: 'Drain Plug', sortOrder: 1 },
        { id: 'ss_rocker_support', name: 'S.S. Rocker Support', sortOrder: 2 },
        { id: 'top_washer', name: 'Top Washer', sortOrder: 3 },
        { id: 'brass_ss_parts', name: 'Brass & S.S. Parts', sortOrder: 4 },
        { id: 'spring_washer', name: 'Spring Washer S.S./M.S.', sortOrder: 5 },
        { id: 'ss_sand_guard', name: 'S.S. Sand Guard', sortOrder: 6 },
        { id: 'pump_couple_spares', name: 'Pump Couple Spares', sortOrder: 7 },
        { id: 'oil_seal_gold_super', name: 'Oil Seal (Gold Super)', sortOrder: 8 },
        { id: 'ms_body_lock', name: 'M.S. Body Lock', sortOrder: 9 },
        { id: 'tb_plate_lock', name: 'S.S./M.S. T.B. Plate Lock', sortOrder: 10 },
        { id: 'ss_pump_shaft', name: 'S.S. Pump Shaft & Wooden Stick', sortOrder: 11 },
        { id: 'hook_paper_ring', name: 'M.S. Hook, Slot Paper & Stud Ring', sortOrder: 12 },
      ],
    },
    // 10. Other / Custom
    {
      id: 'other',
      name: 'Other',
      sortOrder: 10,
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.create({
      data: {
        id: cat.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
      },
    });

    if (cat.children) {
      for (const child of cat.children) {
        await prisma.category.create({
          data: {
            id: child.id,
            name: child.name,
            sortOrder: child.sortOrder,
            parentId: cat.id,
          },
        });
      }
    }
  }

  console.log('Categories created successfully with Impellers hierarchy.');

  // 3. Build item records with exact PDF data and calculated standard retail/customer prices
  const itemsToCreate: {
    srNo?: string;
    name: string;
    brand: string;
    itemCode?: string;
    categoryId: string;
    costPrice: number;
    retailerPrice: number;
    customerPrice: number;
    unit: string;
    sortOrder: number;
  }[] = [];

  const categoryItemCounters: Record<string, number> = {};

  const addItem = (
    catId: string,
    srNo: string | undefined,
    name: string,
    cost: number,
    brand = 'J.K. Spares',
    code?: string,
    unit = 'pcs'
  ) => {
    categoryItemCounters[catId] = (categoryItemCounters[catId] || 0) + 1;
    const sortOrder = categoryItemCounters[catId] * 10;

    // Default price markups: +20% for Retailer, +50% for Customer
    const retailer = Math.round(cost * 1.20 * 10) / 10;
    const customer = Math.round(cost * 1.50 * 10) / 10;

    itemsToCreate.push({
      categoryId: catId,
      srNo: srNo || undefined,
      name,
      brand,
      itemCode: code || undefined,
      costPrice: cost,
      retailerPrice: retailer,
      customerPrice: customer,
      unit,
      sortOrder,
    });
  };

  // ─── 1. C.I. SUBMERSIBLE PARTS ──────────────────────────────────────────────
  // V-3 C.I.
  addItem('v3_ci', '1', 'V-3 / 2-NRV', 250.0);
  addItem('v3_ci', '2.1', 'V-3 / 2-SUCTION Length-80, Dip-33, Collar-70, 4 Hole & 3 Hole, Threading-1.25/1.5', 250.0);
  addItem('v3_ci', '2.2', 'V-3 / 2-SUCTION Length-80, Dip-33, Collar-42, 4 Hole, Threading-1.25/1.5', 250.0);
  addItem('v3_ci', '3', 'V-3 Upper Housing - 3 Hole / 4 Hole 42 MM Collar', 250.0);
  addItem('v3_ci', '4', 'V-3 Upper Housing with Connective', 460.0);
  addItem('v3_ci', '5', 'V-3 Lower Housing - 3 Hole', 250.0);
  addItem('v3_ci', '6', 'V-3 Motor Base Threading Type', 250.0);

  // V-4 C.I.
  addItem('v4_ci', '1', 'V-4 NRV 1" Threading 1.25/1.5 MM', 310.0);
  addItem('v4_ci', '2', 'V-4 NRV 1.25" Threading 1.25/1.5 MM', 320.0);
  addItem('v4_ci', '3', 'V-4 NRV 1.5" Threading 1.25/1.5 MM', 320.0);
  addItem('v4_ci', '4', 'V-4 NRV 2" Threading 1.25/1.5 MM', 320.0);
  addItem('v4_ci', '5', 'V-4 NRV 1"/1.25"/1.5" 86.5MM OD Threading', 380.0);
  addItem('v4_ci', '6', 'V-4 NRV 2" 86.5MM OD Threading', 560.0);
  addItem('v4_ci', '7', 'V-4 NRV CRI Type', 520.0);
  addItem('v4_ci', '8', 'V-4 NRV Texmo 1.25', 500.0);
  addItem('v4_ci', '9', 'V-4 NRV KSB 81/16 1.25" / 1.5" 82MM / 86MM', 260.0);
  addItem('v4_ci', '10', 'V-4 NRV {ECO} 1" / 1.25" / 1.5"', 260.0);
  addItem('v4_ci', '11', 'V-4 NRV Varuna 1.25" / 1.5" 82MM / 86MM', 260.0);

  const v4Suctions = [
    { n: '1', name: 'LENGTH-95, DIP-35, BUSH-30/36, COLLAR-56, PCD-71MM', r: 350.0 },
    { n: '2', name: 'LENGTH-95, DIP-42, BUSH-36, COLLAR-87, PCD-71MM / 76MM', r: 350.0 },
    { n: '3', name: 'LENGTH-95, DIP-42, BUSH-30, COLLAR-87, PCD-71MM / 76MM', r: 350.0 },
    { n: '4', name: 'LENGTH-95, DIP-39, BUSH-36, COLLAR-55, PCD-71MM', r: 350.0 },
    { n: '5', name: 'LENGTH-105, DIP-45, BUSH-30, COLLAR-87, PCD-71MM', r: 360.0 },
    { n: '6', name: 'LENGTH-81, DIP-12, BUSH-36/30, COLLAR-55, PCD-71MM', r: 360.0 },
    { n: '7', name: 'LENGTH-94, DIP-41, BUSH-28, COLLAR-54, PCD-71MM', r: 360.0 },
    { n: '8', name: 'LENGTH-95, DIP-39, BUSH-30, COLLAR-55, PCD-71MM', r: 350.0 },
    { n: '9', name: 'LENGTH-78, DIP-41, BUSH-30, COLLAR-50 MM PLAN PCD-71MM', r: 320.0 },
    { n: '10', name: 'LENGTH-97, DIP-42, BUSH-30, COLLAR-87, 76PCD, 86.5mm Thread', r: 440.0 },
    { n: '11', name: 'LENGTH-105, DIP-44, BUSH-30, COLLAR-58, 76PCD, 86.5mm Thread', r: 440.0 },
    { n: '12', name: 'LENGTH-120, DIP-58, BUSH-30, COLLAR-55, 71PCD', r: 500.0 },
    { n: '13', name: 'LENGTH-120, DIP-58, BUSH-36, COLLAR-55, 71PCD', r: 500.0 },
    { n: '14', name: 'LENGTH-120, DIP-52, BUSH-30, COLLAR-87, 71PCD / 76PCD', r: 500.0 },
    { n: '15', name: 'LENGTH-120, DIP-52, BUSH-36, COLLAR-87, 71PCD / 76PCD', r: 500.0 },
    { n: '16', name: 'LENGTH-80, DIP-31, BUSH-30, COLLAR-55, 71PCD', r: 330.0 },
    { n: '17', name: 'K.S.B. LENGTH-85, COLLAR-82/87, PCD-76 WITHOUT THREAD', r: 320.0 },
    { n: '18', name: 'K.S.B. BUSH - LENGTH-98, DIP-28, BUSH-30, COLLAR-87, PCD-76', r: 390.0 },
    { n: '19', name: 'K.S.B. BUSH - LENGTH-98, DIP-28, BUSH-36, COLLAR-87, PCD-76', r: 390.0 },
    { n: '20', name: 'K.S.B. BUSH - LENGTH-98, DIP-35, BUSH-30, COLLAR-55, PCD-76', r: 390.0 },
    { n: '21', name: 'K.S.B. BUSH - LENGTH-98, DIP-35, BUSH-36, COLLAR-55, PCD-76', r: 390.0 },
    { n: '22', name: 'LENGTH-95, DIP-35, BUSH-36, COLLAR-87, PCD-71MM', r: 360.0 },
    { n: '23', name: 'K.S.B. - LENGTH-85, COLLAR-86/87, PCD-76 WITHOUT THREAD', r: 320.0 },
    { n: '24', name: 'TEXMO - PCD-76 WITHOUT THREAD', r: 360.0 },
    { n: '25', name: 'LENGTH-92, DIP-40, BUSH 30, COLLAR-87, PCD-71MM', r: 360.0 },
    { n: '26', name: 'LENGTH-108, DIP 45, BUSH-30, COLLAR-42, PCD-71MM', r: 500.0 },
    { n: '27', name: 'LENGTH-100, DIP-31, BUSH-30, COLLAR-87, PCD-71MM', r: 380.0 },
    { n: '28', name: 'K.S.B. BUSH LENGTH 120 DIP 77 BUSH-30 COLLAR-87 PCD-76 WITHOUT THREAD', r: 520.0 },
    { n: '29', name: 'LENGTH-92, DIP-12, BUSH-36, COLLAR-55', r: 360.0 },
    { n: '30', name: 'LENGTH-105, DIP-53, BUSH-30, COLLAR-87, 3 Hole (3 LAG)', r: 500.0 },
    { n: '31', name: 'LENGTH-115, DIP-53, BUSH-30, COLLAR-87 GANGA TYPE THREAD 1.25/1.5', r: 500.0 },
    { n: '32', name: 'K.S.B. BUSH 3 LAG 4 Hole, LENGTH 97 DIP 41 BUSH-30, COLLAR 87, PCD-76MM', r: 380.0 },
    { n: '33', name: 'LENGTH-75 WITHOUT BUSH, COLLAR-87, PCD-76MM', r: 360.0 },
    { n: '34', name: 'V-4 SUCTION (CRI TYPE)', r: 360.0 },
    { n: '35', name: 'KSB LENGTH 115 4LAG 4HOLE BUSH-30 DIP-60 PCD-76MM', r: 520.0 },
    { n: '36', name: '92MM LENGTH BUSH -30 DIP 12 COLLAR 55 PCD 71 THREAD 82.8MM', r: 360.0 },
    { n: '37', name: 'KSB LENGTH 85 COLLAR 85/87 PCD 76 MM', r: 320.0 },
    { n: '38', name: 'LUBY LENGTH 88 WITHOUT BUSH THREAD 87MM LH PCD76 MM', r: 360.0 },
    { n: '39', name: 'LUBY LENGTH 88 WITHOUT BUSH THREAD 86.5MM LH PCD76 MM', r: 360.0 },
    { n: '40', name: 'ANGAL LENGTH 107 DIP-37 BUSH -32 THREAD 83.2 PCD-76 MM', r: 440.0 },
    { n: '41', name: 'LUBY LENGTH 88 WITHOUT BUSH THREAD 83MM LH 76PCD MM', r: 360.0 },
    { n: '42', name: 'VARUNA LENGTH 72MM WITHOUT THREAD COLLAR 81/87 PCD-76 MM', r: 320.0 },
    { n: '43', name: 'VARUNA LENGTH 72MM WITHOUT THREAD COLLAR 86/87 PCD-76 MM', r: 320.0 },
    { n: '44', name: 'TEXMO LENGTH 77 OLD MODAL', r: 360.0 },
    { n: '45', name: 'TEXMO LENGTH-120MM COLLAR 81/87 BUSH-26 DIP-72 / PCD-76 MM', r: 520.0 },
    { n: '46', name: 'POLAD LENGTH 110 BUSH 36 DIP 42 THREAD 87.5MM PCD -76 MM', r: 580.0 },
    { n: '47', name: 'LENGTH 110MM BUSH 30 DIP 58 COLLAR 87 THREAD 82.8MM PCD-76 MM', r: 440.0 },
    { n: '48', name: 'LENGTH 105MM BUSH -30 DIP 50 PLAN 50MM COLLAR PCD 71 MM', r: 360.0 },
    { n: '49', name: 'LENGTH 96 BUSH 30 DIP 45 PLAN 50MM COLLAR PCD 71 MM', r: 360.0 },
    { n: '50', name: 'CROMPTON IP LENGTH 77MM PCD76 MM', r: 360.0 },
    { n: '51', name: 'TERO IP LENGTH 75MM 81/86 PCD 76 MM', r: 380.0 },
    { n: '52', name: 'KILOSKAR LENGTH 103 BUSH 30 DIP 44 COLLAR 86/87 PCD76 MM', r: 520.0 },
    { n: '53', name: 'KILOSKAR LENGTH 103 BUSH 30 DIP 44 COLLAR 81/87 PCD76 MM', r: 520.0 },
    { n: '54', name: 'ANGAL LENGTH-95 DIP-30 BUSH-30 THREAD 83.2 PCD-76 MM', r: 370.0 },
  ];
  v4Suctions.forEach((s) => addItem('v4_ci', `12.${s.n}`, `V-4 Suction ${s.name}`, s.r));

  addItem('v4_ci', '13.1', 'V-4 Connective 45 x 56 x 43 Length', 310.0);
  addItem('v4_ci', '13.2', 'V-4 Connective 48 x 88 x 43 Length', 310.0);
  addItem('v4_ci', '13.3', 'V-4 Connective 55 x 55 x 40 Length', 310.0);
  addItem('v4_ci', '13.4', 'V-4 Connective 48 x 54 x 40 Length', 320.0);
  addItem('v4_ci', '13.5', 'V-4 Connective 55 x 55 x 45 Length', 320.0);
  addItem('v4_ci', '13.6', 'V-4 Connective 48 x 58 x 43 Length Falcon', 320.0);

  addItem('v4_ci', '14.1', 'V-4 Upper Housing Collar 45mm/48mm/55mm Bush-36/32', 320.0);
  addItem('v4_ci', '14.2', 'V-4 Upper Housing Without Connective 3 Hole / 4 Hole 50mm Collar', 350.0);
  addItem('v4_ci', '14.3', 'V-4 Upper Housing With Connective Bush 36mm 32mm', 520.0);
  addItem('v4_ci', '14.4', 'V-4 Upper Housing Texmo', 420.0);
  addItem('v4_ci', '14.5', 'V-4 Upper Housing Tero', 460.0);
  addItem('v4_ci', '14.6', 'V-4 Upper Housing Varuna Vandan', 380.0);
  addItem('v4_ci', '14.7', 'V-4 Upper Housing Lubi Paval {CI}', 440.0);
  addItem('v4_ci', '14.8', 'V-4 Upper Housing KSB Paval {CI}', 500.0);
  addItem('v4_ci', '14.9', 'V-4 Upper Housing CRI Paval {GI}', 420.0);
  addItem('v4_ci', '14.10', 'V-4 Upper Housing Texmo Paval {GI}', 580.0);

  addItem('v4_ci', '15.1', 'V-4 Lower Housing 3-Hole 86mm Threading 36/32', 330.0);
  addItem('v4_ci', '15.2', 'V-4 Lower Housing 4-Hole Press Type', 330.0);
  addItem('v4_ci', '15.3', 'V-4 Lower Housing 4-Hole 88mm Threading 36mm', 330.0);
  addItem('v4_ci', '15.4', 'V-4 Lower Housing 6-Hole 85.5mm Threading 36', 330.0);
  addItem('v4_ci', '15.5', 'V-4 Lower Housing Varuna Vandan', 380.0);
  addItem('v4_ci', '15.6', 'V-4 Lower Housing Texmo', 520.0);
  addItem('v4_ci', '15.7', 'V-4 Lower Housing Lubi Paval {CI}', 400.0);
  addItem('v4_ci', '15.8', 'V-4 Lower Housing KSB Paval {CI}', 460.0);
  addItem('v4_ci', '15.9', 'V-4 Lower Housing CRI Paval {GI}', 390.0);
  addItem('v4_ci', '15.10', 'V-4 Lower Housing Texmo Paval {GI}', 550.0);

  addItem('v4_ci', '16.1', 'V-4 Motor Base Falcon', 470.0);
  addItem('v4_ci', '16.2', 'V-4 Motor Base Jalganga', 470.0);
  addItem('v4_ci', '16.3', 'V-4 Motor Base 85mm Threading 60mm Dip', 340.0);
  addItem('v4_ci', '16.4', 'V-4 Motor Base 4-Hole Press Type 53mm Dip', 340.0);
  addItem('v4_ci', '16.5', 'V-4 Motor Base 86.5mm, 65mm Dip', 340.0);
  addItem('v4_ci', '16.6', 'V-4 Motor Base 84.5mm 53mm Dip', 340.0);
  addItem('v4_ci', '16.7', 'V-4 Motor Base Texmo', 260.0);
  addItem('v4_ci', '16.8', 'V-4 Motor Base Plat Texmo', 250.0);

  addItem('v4_ci', '17', 'V-4 Q Type Bowl', 420.0);
  addItem('v4_ci', '18', 'V-4 Q Type NRV 2"', 370.0);
  addItem('v4_ci', '19', 'V-4 Q Suction', 520.0);
  addItem('v4_ci', '20', 'V-4 Patti Type Bowl', 420.0);
  addItem('v4_ci', '21', 'V-4 Middai Bush 30mm Length 30mm', 130.0);
  addItem('v4_ci', '22', 'V-4 Dol Bush 30mm Length 25mm', 110.0);

  // V-5 C.I.
  addItem('v5_ci', '1', 'NRV 1.25" / 1.5" / 2", 98.5MM THREAD', 550.0);
  addItem('v5_ci', '2', 'SUCTION LENGTH 102 MM DIP 51 COLLAR 60 MM THREAD 98.5 MM', 700.0);
  addItem('v5_ci', '3', 'CONNECTIVE COLLAR 55 IP 60 LENGTH 50', 570.0);
  addItem('v5_ci', '4', 'UPPER HOUSING COLLAR 55 BUSH 45mm', 490.0);
  addItem('v5_ci', '5', 'LOWER HOUSING BUSH-45 MM 3-HOLE THREAD-104', 550.0);
  addItem('v5_ci', '6', 'MOTOR BASE THREAD-102, DIP-75', 610.0);

  // S.S. Pump Parts (V-6 C.I.)
  addItem('v6_ss_pump_parts', '1', 'S.S. Pump Suction', 1200.0);
  addItem('v6_ss_pump_parts', '2', 'S.S. Pump Suction Topaland Type', 1200.0);
  addItem('v6_ss_pump_parts', '3', 'S.S. Pump NRV 2" / 2.5" 110mm Length', 960.0);
  addItem('v6_ss_pump_parts', '4', 'S.S. Pump NRV 2" / 2.5" 125mm Length', 1040.0);
  addItem('v6_ss_pump_parts', '5', 'S.S. Pump NRV Topland Type', 1100.0);
  addItem('v6_ss_pump_parts', '6', 'Connective', 760.0);
  addItem('v6_ss_pump_parts', '7', 'Upper Housing', 720.0);
  addItem('v6_ss_pump_parts', '8', 'Lower Housing / Threading & Press Type', 820.0);
  addItem('v6_ss_pump_parts', '9', 'Lower Housing Falcon Type', 1060.0);
  addItem('v6_ss_pump_parts', '10', 'Motor Base 1.5mm Thread / 2mm Thread', 920.0);
  addItem('v6_ss_pump_parts', '11', 'Motor Base Press Type', 920.0);
  addItem('v6_ss_pump_parts', '12', 'Motor Base Falcon Type', 1300.0);
  addItem('v6_ss_pump_parts', '13', 'Upper Housing Taro', 720.0);
  addItem('v6_ss_pump_parts', '14', 'Lower Housing Taro', 820.0);

  // Deccan Type Parts
  addItem('deccan_parts', '15', 'Deccan Type Lower Housing Heavy', 410.0);
  addItem('deccan_parts', '16', 'Deccan Type Lower Housing Light', 380.0);
  addItem('deccan_parts', '17', 'Deccan Type Suction Heavy', 990.0);
  addItem('deccan_parts', '18', 'Deccan Type Suction Light', 890.0);
  addItem('deccan_parts', '19', 'Deccan Type NRV 2"', 340.0);
  addItem('deccan_parts', '20', 'Deccan Type NRV 2.5"', 520.0);
  addItem('deccan_parts', '21', 'Deccan Type NRV K Type 2"', 830.0);
  addItem('deccan_parts', '22', 'Deccan Type NRV K Type 2.5"', 840.0);
  addItem('deccan_parts', '23', 'Deccan Type DOL', 640.0);
  addItem('deccan_parts', '24', 'Deccan Type Motor Base Heavy', 490.0);
  addItem('deccan_parts', '25', 'Deccan Type Motor Base Light', 460.0);

  // ─── 2. IMPELLERS (OPENWELL & MONO BLOCK) ───────────────────────────────────
  // Page 06: Openwell Impeller (1 to 32)
  const openwellItems = [
    { sr: '1', name: 'Openwell Impeller 0.5 HP 15 x 113 x 35 x 6 x 7', r: 260.0 },
    { sr: '2', name: 'Openwell Impeller 1 HP 20 x 142 x 50 x 8 x 5', r: 380.0 },
    { sr: '3', name: 'Openwell Impeller 1 HP 20 x 158 x 50 x 8 x 5', r: 460.0 },
    { sr: '4', name: 'Openwell Impeller 1.5HP 20 X158X55X8X6', r: 460.0 },
    { sr: '5', name: 'Openwell Impeller 1.5 HP 20 x 158 x 60 x 8 x 6', r: 460.0 },
    { sr: '6', name: 'Openwell Impeller 2 HP 20X155X60X4X8', r: 460.0 },
    { sr: '7', name: 'Openwell Impeller 2 HP 20X158X65X8X7', r: 460.0 }, // Fixed from typo 2 to 7
    { sr: '8', name: 'Openwell Impeller 2 HP 20 x 158 x 60 x 8 x 7', r: 460.0 },
    { sr: '9', name: 'Openwell Impeller 3 HP 20 x 152 x 75 x 8 x 7', r: 480.0 },
    { sr: '10', name: 'Openwell Impeller 5 HP 20/24 x 158 x 75 x 8 x 7', r: 500.0 },
    { sr: '11', name: 'Openwell Impeller 3 HP 24 x 152 x 75 x 5 x 9', r: 530.0 },
    { sr: '12', name: 'Openwell Impeller 3 HP 24 x 160 x 75 x 6 x 7', r: 550.0 },
    { sr: '13', name: 'Openwell Impeller 3 HP 24 x 160 x 75 x 5 x 7', r: 550.0 },
    { sr: '14', name: 'Openwell Impeller 5 HP 24 x 155 x 75 x 5 x 12', r: 540.0 },
    { sr: '15', name: 'Openwell Impeller 5 HP 24 x 155 x 75 x 5 x 14', r: 540.0 },
    { sr: '16', name: 'Openwell Impeller 5 HP 24 x 155 x 85 x 6 x 12', r: 540.0 },
    { sr: '17', name: 'Openwell Impeller 5 HP 24 x 180 x 75 x 6 x 6', r: 650.0 },
    { sr: '18', name: 'Openwell Impeller 6.5 HP 24 x 162 x 75 x 5 x 12', r: 550.0 },
    { sr: '19', name: 'Openwell Impeller 6.5 HP 24 x 162 x 85 x 6 x 14', r: 550.0 },
    { sr: '20', name: 'Openwell Impeller 6.5 HP 24 x 180 x 75 x 6 x 9', r: 650.0 },
    { sr: '21', name: 'Openwell Impeller 7.5 HP 24 x 172 x 75 x 5 x 14', r: 640.0 },
    { sr: '22', name: 'Openwell Impeller 7.5 HP 24 x 180 x 75 x 5 x 12', r: 670.0 },
    { sr: '23', name: 'Openwell Impeller 7.5 HP 24 x 180 x 85 x 6 x 12', r: 670.0 },
    { sr: '24', name: 'Openwell Impeller 7.5 HP 24 x 180 x 75 x 6 x 14', r: 680.0 },
    { sr: '25', name: 'Openwell Impeller 10 HP 24 x 180 x 85 x 6 x 17', r: 730.0 },
    { sr: '26', name: 'Openwell Impeller 10 HP 24 x 175 x 107 x 6 x 20', r: 790.0 },
    { sr: '27', name: 'Openwell Impeller 7.5 HP 24 x 200 x 75 x 8 x 7', r: 860.0 },
    { sr: '28', name: 'Openwell Impeller 6.5 HP 24 x 195 x 75 x 8 x 6', r: 790.0 },
    { sr: '29', name: 'Openwell Impeller 7.5HP/10HP - 24 x 213 x 75 x 5 7/9/11', r: 940.0 },
    { sr: '30', name: 'Openwell Impeller 7.5 HP 24 x 175 x 75 x 4 x 12', r: 660.0 },
    { sr: '31', name: 'Openwell Impeller 3 HP - 24x138x75x5x12 (2.5 x 2.5) KIT TYPE', r: 380.0 },
    { sr: '32', name: 'Openwell Impeller 5 HP - 24x158x75x5x12 (2.5 x 2.5) KIT TYPE', r: 440.0 },
  ];
  openwellItems.forEach((i) => addItem('openwell_impeller', i.sr, i.name, i.r));

  // Page 07: Mono Block Impeller (33 to 74)
  const monoItems = [
    { sr: '33', name: 'Mono Block Impeller 0.5 HP AQUA TEXMO 1.5X1.5 ACS 340', r: 480.0 },
    { sr: '34', name: 'Mono Block Impeller 1 HP AQUA TEXMO 2X2 ACS 650', r: 520.0 },
    { sr: '35', name: 'Mono Block Impeller 1 HP AQUA TEXMO 3X3 ACS 775', r: 530.0 },
    { sr: '36', name: 'Mono Block Impeller 1.5 HP AQUA TEXMO 3X3 ACS 1170X1175', r: 570.0 },
    { sr: '37.1', name: 'Mono Block Impeller 1.5 HP AQUA TEXMO 1165X1170 65X50', r: 520.0 },
    { sr: '37.2', name: 'Mono Block Impeller 0.5 HP VARUNA 1.5X1.5 28 B', r: 380.0 },
    { sr: '38', name: 'Mono Block Impeller 0.5 HP VARUNA 2X2 29 B', r: 460.0 },
    { sr: '39', name: 'Mono Block Impeller 1 HP VARUNA 3X3 40 B', r: 500.0 },
    { sr: '40.1', name: 'Mono Block Impeller 1 HP VARUNA 2X2 17 B', r: 400.0 },
    { sr: '40.2', name: 'Mono Block Impeller 2 HP VARUNA 2.5X2.5 26 B', r: 400.0 },
    { sr: '41', name: 'Mono Block Impeller 2 HP VARUNA 3X3 30 B', r: 620.0 },
    { sr: '42', name: 'Mono Block Impeller 0.5 HP KILOSKAR 1.5x1.5 KDS 0.5', r: 330.0 },
    { sr: '43', name: 'Mono Block Impeller 1 HP KILOSKAR 2X2 KDS 112', r: 430.0 },
    { sr: '44', name: 'Mono Block Impeller 1 HP KILOSKAR 3X3 KDS 11', r: 350.0 },
    { sr: '45', name: 'Mono Block Impeller 2 HP KILOSKAR 3X3 KDS 212+', r: 580.0 },
    { sr: '46', name: 'Mono Block Impeller 0.5 HP FLANCH', r: 76.0 },
    { sr: '47', name: 'Mono Block Impeller 1 HP - SQUARE FLANCH', r: 130.0 },
    { sr: '48', name: 'Mono Block Impeller 1.5 HP SQUARE FLANCH', r: 140.0 },
    { sr: '49', name: 'Mono Block Impeller 2 HP SQUARE FLANCH', r: 200.0 },
    { sr: '50', name: 'Mono Block Impeller 3 HP - MINI 2" 2.5 SQUARE FLANCH', r: 220.0 },
    { sr: '51', name: 'Mono Block Impeller OPEN WELL 2", 2.5", 3" SQUARE FLANCH', r: 276.0 },
    { sr: '52', name: 'Mono Block Impeller OPEN WELL 4X4 SQUARE FLANCH', r: 490.0 },
    { sr: '53', name: 'Mono Block Impeller 0.5 HP - CASING 115mm-ID, PCD-139mm', r: 470.0 },
    { sr: '54', name: 'Mono Block Impeller 0.5 HP - CASING 125 MM-ID, PCD-143 MM', r: 460.0 },
    { sr: '55', name: 'Mono Block Impeller 1 HP CASING 143MM-ID, PCD-164 MM', r: 820.0 },
    { sr: '56', name: 'Mono Block Impeller 1.5 HP - CASING 160 MM ID, PCD-184 MM', r: 900.0 },
    { sr: '57', name: 'Mono Block Impeller 2 HP - CASING 160 MM-ID, PCD-184 MM', r: 960.0 },
    { sr: '58', name: 'Mono Block Impeller 3 HP - CASING 160 MM-ID, PCD-184 MM', r: 980.0 },
    { sr: '59', name: 'Mono Block Impeller 3 HP - CASING HH 164 MM-ID, PCD-195 MM', r: 1500.0 },
    { sr: '60', name: 'Mono Block Impeller 5 HP - OW CASING 164MM-ID, PCD-195 MM', r: 1540.0 },
    { sr: '61', name: 'Mono Block Impeller 5 HP - HH CASING 181 MM-ID, PCD-203 MM', r: 1540.0 },
    { sr: '62', name: 'Mono Block Impeller 7.5 HP - HH CASING 181 MM-ID, PCD-203 MM', r: 1540.0 },
    { sr: '63', name: 'Mono Block Impeller 7.5 HP - 3"x3" CASING 181mm-ID, PCD-203 MM', r: 1890.0 },
    { sr: '64', name: 'Mono Block Impeller 7.5 HP - HH CASING 201MM-ID, PCD-222 MM', r: 1660.0 },
    { sr: '65', name: 'Mono Block Impeller 7.5HP/10HP - CASING 215 MM-ID, PCD-237 MM', r: 1900.0 },
    { sr: '66', name: 'Mono Block Impeller 10 HP 4X4 CASING 181 MM ID PCD 203 MM', r: 2570.0 },
    { sr: '67', name: 'Mono Block Impeller 0.5 HP TOPALI 70 MM ID 3 HOLL', r: 190.0 },
    { sr: '68', name: 'Mono Block Impeller 1 HP 2HP 3 HP MINI TOPALI 85 MM ID 3 HOLL', r: 290.0 },
    { sr: '69', name: 'Mono Block Impeller 5 HP O.W TOPALI 115 MM ID 4 HOLL', r: 380.0 },
    { sr: '70', name: 'Mono Block Impeller 1 HP 2 HP 3 HP SINGLE HOUSING COLLAR 135X42 129.5X42 135X38', r: 520.0 },
    { sr: '71', name: 'Mono Block Impeller 1 HP 2 HP 3 HP DOUBLE HOUSING COLLAR 135X42 129.5X42 135X38', r: 720.0 },
    { sr: '72', name: 'Mono Block Impeller 5 HP O.W SINGLE COLLAR HOUSING', r: 1180.0 },
    { sr: '73', name: 'Mono Block Impeller 5 HP O.W DOUBLE COLLAR HOUSING 164MM', r: 1490.0 },
    { sr: '74', name: 'Mono Block Impeller 7.5 HP O.W DOUBLE COLLAR HOUSING 181MM', r: 1520.0 },
  ];
  monoItems.forEach((i) => addItem('monoblock_impeller', i.sr, i.name, i.r));

  // ─── 3. THRUST BEARING, COUNTER & BEARING SET ──────────────────────────────
  const thrustItems = [
    { sr: '1.1', name: 'V-4 60mm Single Plate - Teflon', r: 64.0 },
    { sr: '1.2', name: 'V-4 60mm Single Plate - Super Teflon', r: 90.0 },
    { sr: '1.3', name: 'V-4 60mm Single Plate - Carbon', r: 110.0 },
    { sr: '1.4', name: 'V-4 60mm Single Plate - Super Carbon', r: 160.0 },
    { sr: '1.5', name: 'V-4 60mm Single Plate - Fiber', r: 120.0 },
    { sr: '1.6', name: 'V-4 60mm Single Plate - Super Fiber', r: 140.0 },
    { sr: '2.1', name: 'V-4 50mm Single Plate - Teflon', r: 64.0 },
    { sr: '2.2', name: 'V-4 50mm Single Plate - Super Teflon', r: 80.0 },
    { sr: '2.3', name: 'V-4 50mm Single Plate - Carbon', r: 100.0 },
    { sr: '3.1', name: 'V-7 Mini 60mm Double Plate - Teflon', r: 100.0 },
    { sr: '3.2', name: 'V-7 Mini 60mm Double Plate - Super Teflon', r: 140.0 },
    { sr: '3.3', name: 'V-7 Mini 60mm Double Plate - Carbon', r: 160.0 },
    { sr: '3.4', name: 'V-7 Mini 60mm Double Plate - Super Carbon', r: 220.0 },
    { sr: '3.5', name: 'V-7 Mini 60mm Double Plate - Fiber', r: 140.0 },
    { sr: '3.6', name: 'V-7 Mini 60mm Double Plate - Super Fiber', r: 200.0 },
    { sr: '4.1', name: 'V-8 Single Plate - Teflon', r: 100.0 },
    { sr: '4.2', name: 'V-8 Single Plate - Super Teflon', r: 140.0 },
    { sr: '4.3', name: 'V-8 Single Plate - Carbon', r: 180.0 },
    { sr: '4.4', name: 'V-8 Single Plate - Super Carbon', r: 240.0 },
    { sr: '4.5', name: 'V-8 Single Plate - Fiber', r: 140.0 },
    { sr: '4.6', name: 'V-8 Single Plate - Super Fiber', r: 200.0 },
    { sr: '5.1', name: 'V-8 Double Plate - Teflon', r: 120.0 },
    { sr: '5.2', name: 'V-8 Double Plate - Super Teflon', r: 170.0 },
    { sr: '5.3', name: 'V-8 Double Plate - Carbon', r: 200.0 },
    { sr: '5.4', name: 'V-8 Double Plate - Super Carbon', r: 280.0 },
    { sr: '5.5', name: 'V-8 Double Plate - Fiber', r: 180.0 },
    { sr: '5.6', name: 'V-8 Double Plate - Super Fiber', r: 220.0 },
    { sr: '6.1', name: 'V-5 65mm Plate - Teflon', r: 90.0 },
    { sr: '6.2', name: 'V-5 65mm Plate - Super Teflon', r: 120.0 },
    { sr: '6.3', name: 'V-5 65mm Plate - Carbon', r: 160.0 },
    { sr: '6.4', name: 'V-5 65mm Plate - Super Carbon', r: 220.0 },
    { sr: '6.5', name: 'V-5 65mm Plate - Fiber', r: 120.0 },
    { sr: '6.6', name: 'V-5 65mm Plate - Super Fiber', r: 160.0 },
    { sr: '7.1', name: 'V-6 70mm Single Plate - Teflon', r: 110.0 },
    { sr: '7.2', name: 'V-6 70mm Single Plate - Super Teflon', r: 150.0 },
    { sr: '7.3', name: 'V-6 70mm Single Plate - Carbon', r: 190.0 },
    { sr: '7.4', name: 'V-6 70mm Single Plate - Super Carbon', r: 260.0 },
    { sr: '7.5', name: 'V-6 70mm Single Plate - Fiber', r: 140.0 },
    { sr: '7.6', name: 'V-6 70mm Single Plate - Super Fiber', r: 200.0 },
    { sr: '8.1', name: 'V-6 80x20mm Single Plate - Teflon', r: 140.0 },
    { sr: '8.2', name: 'V-6 80x20mm Single Plate - Super Teflon', r: 180.0 },
    { sr: '8.3', name: 'V-6 80x20mm Single Plate - Carbon', r: 220.0 },
    { sr: '8.4', name: 'V-6 80x20mm Single Plate - Super Carbon', r: 860.0 },
    { sr: '8.5', name: 'V-6 80x20mm Single Plate - Fiber', r: 190.0 },
    { sr: '9.1', name: 'V-6 80x25x25mm Single Plate - Teflon', r: 170.0 },
    { sr: '9.2', name: 'V-6 80x25x25mm Single Plate - Super Teflon', r: 210.0 },
    { sr: '9.3', name: 'V-6 80x25x25mm Single Plate - Carbon', r: 280.0 },
    { sr: '9.4', name: 'V-6 80x25x25mm Single Plate - Super Carbon', r: 380.0 },
    { sr: '9.5', name: 'V-6 80x25x25mm Single Plate - Fiber', r: 200.0 },
    { sr: '10.1', name: 'V-6 80x25x20mm (Falcon Type) - Super Teflon', r: 240.0 },
    { sr: '10.2', name: 'V-6 80x25x20mm (Falcon Type) - Carbon', r: 320.0 },
    { sr: '10.3', name: 'V-6 80x25x20mm (Falcon Type) - Super Carbon', r: 390.0 },
    { sr: '11.1', name: 'V-6 80x20x20 Plate - Super Teflon', r: 240.0 },
    { sr: '11.2', name: 'V-6 80x20x20 Plate - Carbon', r: 320.0 },
    { sr: '11.3', name: 'V-6 80x20x20 Plate - Super Carbon', r: 390.0 },
    { sr: '12.1', name: 'V-6 90x20mm Single Plate - Teflon', r: 200.0 },
    { sr: '12.2', name: 'V-6 90x20mm Single Plate - Super Teflon', r: 230.0 },
    { sr: '12.3', name: 'V-6 90x20mm Single Plate - Carbon', r: 320.0 },
    { sr: '12.4', name: 'V-6 90x20mm Single Plate - Super Carbon', r: 400.0 },
    { sr: '12.5', name: 'V-6 90x20mm Single Plate - Fiber', r: 260.0 },
    { sr: '13.1', name: 'V-6 90x25x25mm - Teflon', r: 220.0 },
    { sr: '13.2', name: 'V-6 90x25x25mm - Super Teflon', r: 260.0 },
    { sr: '13.3', name: 'V-6 90x25x25mm - Carbon', r: 390.0 },
    { sr: '13.4', name: 'V-6 90x25x25mm - Super Carbon', r: 420.0 },
    { sr: '13.5', name: 'V-6 90x25x25mm - Fiber', r: 280.0 },
    { sr: '14.1', name: 'V-6 90x25x20 (Falcon Type) - Super Teflon', r: 280.0 },
    { sr: '14.2', name: 'V-6 90x25x20 (Falcon Type) - Carbon', r: 360.0 },
    { sr: '14.3', name: 'V-6 90x25x20 (Falcon Type) - Super Carbon', r: 420.0 },
    { sr: '15.1', name: 'V-6 90x20x20 Plate - Super Teflon', r: 280.0 },
    { sr: '15.2', name: 'V-6 90x20x20 Plate - Carbon', r: 360.0 },
    { sr: '15.3', name: 'V-6 90x20x20 Plate - Super Carbon', r: 420.0 },
    { sr: '16.1', name: 'Mini Openwell 60x28/30 Plate - Teflon', r: 100.0 },
    { sr: '16.2', name: 'Mini Openwell 60x28/30 Plate - Super Teflon', r: 120.0 },
    { sr: '16.3', name: 'Mini Openwell 60x28/30 Plate - Carbon', r: 140.0 },
    { sr: '16.4', name: 'Mini Openwell 60x28/30 Plate - Fiber', r: 120.0 },
    { sr: '17.1', name: 'V-9 Openwell 70x30/32/38 Plate - Teflon', r: 120.0 },
    { sr: '17.2', name: 'V-9 Openwell 70x30/32/38 Plate - Super Teflon', r: 140.0 },
    { sr: '17.3', name: 'V-9 Openwell 70x30/32/38 Plate - Carbon', r: 170.0 },
    { sr: '17.4', name: 'V-9 Openwell 70x30/32/38 Plate - Fiber', r: 140.0 },
    { sr: '18.1', name: 'V-9 Openwell 80x30/32/38 Plate - Teflon', r: 160.0 },
    { sr: '18.2', name: 'V-9 Openwell 80x30/32/38 Plate - Super Teflon', r: 180.0 },
    { sr: '18.3', name: 'V-9 Openwell 80x30/32/38 Plate - Carbon', r: 230.0 },
    { sr: '18.4', name: 'V-9 Openwell 80x30/32/38 Plate - Fiber', r: 180.0 },
    { sr: '19.1', name: 'V-9 Openwell 90x33 Plate - Teflon', r: 200.0 },
    { sr: '19.2', name: 'V-9 Openwell 90x33 Plate - Super Teflon', r: 230.0 },
    { sr: '19.3', name: 'V-9 Openwell 90x33 Plate - Carbon', r: 320.0 },
    { sr: '19.4', name: 'V-9 Openwell 90x33 Plate - Fiber', r: 230.0 },
  ];
  thrustItems.forEach((i) => addItem('thrust_bearing_plate', i.sr, i.name, i.r, 'Victor'));

  // S.S. Counter (1 to 24)
  const ssCounters = [
    { sr: '1', name: 'V-3 Counter', r: 50.0 },
    { sr: '2', name: 'V-4 Counter', r: 64.0 },
    { sr: '3', name: 'V-4 Counter C.I. + S.S.', r: 110.0 },
    { sr: '4', name: 'V-4 Counter Heavy - 60mm', r: 80.0 },
    { sr: '5', name: 'V-4 Counter - 50mm', r: 60.0 },
    { sr: '6', name: 'V-6 Counter - 80mm', r: 160.0 },
    { sr: '7', name: 'V-6 Counter - 80mm C.I. + S.S.', r: 200.0 },
    { sr: '8', name: 'V-6 Counter - 80mm Loose (Til Til 3-Payd)', r: 440.0 },
    { sr: '9', name: 'V-6 Counter - 80mm Loose (Til Til 4-Payd)', r: 500.0 },
    { sr: '10', name: 'V-6 Counter - 90mm', r: 190.0 },
    { sr: '11', name: 'V-6 Counter - 90mm C.I. + S.S.', r: 240.0 },
    { sr: '12', name: 'V-6 Counter - 90mm Loose (Til Til 4-Payd)', r: 520.0 },
    { sr: '13', name: 'V-6 Counter - 90mm Loose (Til Til 5-Payd)', r: 580.0 },
    { sr: '14', name: 'Openwell Counter - 50mm', r: 60.0 },
    { sr: '15', name: 'Openwell Counter - 60mm', r: 64.0 },
    { sr: '16', name: 'Openwell Counter - 65mm', r: 70.0 },
    { sr: '17', name: 'Openwell Counter - 70mm', r: 75.0 },
    { sr: '18', name: 'Openwell Counter - 75mm', r: 100.0 },
    { sr: '19', name: 'Openwell Counter - 80mm', r: 120.0 },
    { sr: '20', name: '60 x 38/40/42 - Step Counter', r: 80.0 },
    { sr: '21', name: '65 x 38/40/42/45 - Step Counter', r: 95.0 },
    { sr: '22', name: '70 x 40/42/45/50 - Step Counter', r: 105.0 },
    { sr: '23', name: '80 x 40/42/45/50 - Step Counter', r: 130.0 },
    { sr: '24', name: '90 x 42/45/50/60 - Step Counter', r: 190.0 },
  ];
  ssCounters.forEach((i) => addItem('ss_counter', i.sr, i.name, i.r));

  // Bearing Set Premium (1 to 15)
  const bearingSets = [
    { sr: '1', name: 'Bearing Set Premium 80mm SU / Kamal', r: 2100.0 },
    { sr: '2', name: 'Bearing Set Premium 80 x 25 x 25 Set', r: 2100.0 },
    { sr: '3', name: 'Bearing Set Premium 80mm Falcon', r: 2100.0 },
    { sr: '4', name: 'Bearing Set Premium 80mm Texmo', r: 2200.0 },
    { sr: '5', name: 'Bearing Set Premium 80mm Peguing', r: 2100.0 },
    { sr: '6', name: 'Bearing Set Premium 80mm Aroma', r: 2100.0 },
    { sr: '7', name: 'Bearing Set Premium 80mm Aqua Sub.', r: 2100.0 },
    { sr: '8', name: 'Bearing Set Premium 80mm CRT', r: 2200.0 },
    { sr: '9', name: 'Bearing Set Premium 80mm Laxmi Lada', r: 2100.0 },
    { sr: '10', name: 'Bearing Set Premium 80mm Luby', r: 2100.0 },
    { sr: '11', name: 'Bearing Set Premium 80mm K.S.B.', r: 2100.0 },
    { sr: '12', name: 'Bearing Set Premium 80mm Samruddhi', r: 2100.0 },
    { sr: '13', name: 'Bearing Set Premium 80mm Tero', r: 2200.0 },
    { sr: '14', name: 'Bearing Set Premium V4 60x18 Premium', r: 1000.0 },
    { sr: '15', name: 'Bearing Set Premium 70mm Premium', r: 1200.0 },
  ];
  bearingSets.forEach((i) => addItem('bearing_set_premium', i.sr, i.name, i.r));

  // ─── 4. L.B. BUSH & RUBBER BUSH ─────────────────────────────────────────────
  // L.B. Bush (1 to 169)
  const lbBushData = [
    { n: 1, s: '38x50x60', r: 660 }, { n: 2, s: '37.5x50x60', r: 690 }, { n: 3, s: '37x50x60', r: 720 },
    { n: 4, s: '36.5x50x60', r: 750 }, { n: 5, s: '36x50x60', r: 780 }, { n: 6, s: '35.5x50x60', r: 810 },
    { n: 7, s: '35x50x60', r: 850 }, { n: 8, s: '38x50x50', r: 550 }, { n: 9, s: '37.5x50x50', r: 575 },
    { n: 10, s: '37x50x50', r: 600 }, { n: 11, s: '36.5x50x50', r: 625 }, { n: 12, s: '36x50x50', r: 650 },
    { n: 13, s: '35.5x50x50', r: 675 }, { n: 14, s: '35x50x50', r: 700 }, { n: 15, s: '38x50x40', r: 440 },
    { n: 16, s: '37.5x50x40', r: 460 }, { n: 17, s: '37x50x40', r: 480 }, { n: 18, s: '36.5x50x40', r: 500 },
    { n: 19, s: '36x50x40', r: 520 }, { n: 20, s: '35.5x50x40', r: 540 }, { n: 21, s: '35x50x40', r: 560 },
    { n: 22, s: '38x48x40', r: 400 }, { n: 23, s: '37.5x48x40', r: 420 }, { n: 24, s: '37x48x40', r: 440 },
    { n: 25, s: '36.5x48x40', r: 460 }, { n: 26, s: '36x48x40', r: 480 }, { n: 27, s: '35.5x48x40', r: 500 },
    { n: 28, s: '35x48x40', r: 520 }, { n: 29, s: '38x45x60', r: 420 }, { n: 30, s: '37.5x45x60', r: 435 },
    { n: 31, s: '37x45x60', r: 455 }, { n: 32, s: '36.5x45x60', r: 475 }, { n: 33, s: '36x45x60', r: 495 },
    { n: 34, s: '35.5x45x60', r: 515 }, { n: 35, s: '35x45x60', r: 535 }, { n: 36, s: '38x45x50', r: 350 },
    { n: 37, s: '37.5x45x50', r: 365 }, { n: 38, s: '37x45x50', r: 380 }, { n: 39, s: '36.5x45x50', r: 395 },
    { n: 40, s: '36x45x50', r: 410 }, { n: 41, s: '35.5x45x50', r: 425 }, { n: 42, s: '35x45x50', r: 440 },
    { n: 43, s: '38x45x40', r: 280 }, { n: 44, s: '37.5x45x40', r: 290 }, { n: 45, s: '37x45x40', r: 300 },
    { n: 46, s: '36.5x45x40', r: 310 }, { n: 47, s: '36x45x40', r: 320 }, { n: 48, s: '35.5x45x40', r: 330 },
    { n: 49, s: '35x45x40', r: 340 }, { n: 50, s: '32x42x50', r: 400 }, { n: 51, s: '31.5x42x50', r: 420 },
    { n: 52, s: '31x42x50', r: 440 }, { n: 53, s: '30.5x42x50', r: 450 }, { n: 54, s: '30x42x50', r: 460 },
    { n: 55, s: '29.5x42x50', r: 480 }, { n: 56, s: '29x42x50', r: 500 }, { n: 57, s: '28.5x42x50', r: 520 },
    { n: 58, s: '28x42x50', r: 540 }, { n: 59, s: '27.5x42x50', r: 560 }, { n: 60, s: '27x42x50', r: 580 },
    { n: 61, s: '32x42x40', r: 320 }, { n: 62, s: '31.5x42x40', r: 330 }, { n: 63, s: '31x42x40', r: 340 },
    { n: 64, s: '30.5x42x40', r: 350 }, { n: 65, s: '30x42x40', r: 370 }, { n: 66, s: '29.5x42x40', r: 390 },
    { n: 67, s: '29x42x40', r: 400 }, { n: 68, s: '28.5x42x40', r: 420 }, { n: 69, s: '28x42x40', r: 440 },
    { n: 70, s: '27.5x42x40', r: 450 }, { n: 71, s: '27x42x40', r: 460 }, { n: 72, s: '32x42x30', r: 240 },
    { n: 73, s: '31.5x42x30', r: 250 }, { n: 74, s: '31x42x30', r: 260 }, { n: 75, s: '30.5x42x30', r: 270 },
    { n: 76, s: '30x42x30', r: 280 }, { n: 77, s: '29.5x42x30', r: 290 }, { n: 78, s: '29x42x30', r: 300 },
    { n: 79, s: '28.5x42x30', r: 310 }, { n: 80, s: '28x42x30', r: 320 }, { n: 81, s: '27.5x42x30', r: 330 },
    { n: 82, s: '27x42x30', r: 340 }, { n: 83, s: '32x40x40', r: 260 }, { n: 84, s: '31.5x40x40', r: 270 },
    { n: 85, s: '31x40x40', r: 280 }, { n: 86, s: '30.5x40x40', r: 290 }, { n: 87, s: '30x40x40', r: 300 },
    { n: 88, s: '29.5x40x40', r: 320 }, { n: 89, s: '29x40x40', r: 340 }, { n: 90, s: '28.5x40x40', r: 360 },
    { n: 91, s: '28x40x40', r: 380 }, { n: 92, s: '27.5x40x40', r: 400 }, { n: 93, s: '27x40x40', r: 420 },
    { n: 94, s: '30x38x40', r: 240 }, { n: 95, s: '29.5x38x40', r: 260 }, { n: 96, s: '29x38x40', r: 280 },
    { n: 97, s: '28.5x38x40', r: 300 }, { n: 98, s: '28x38x40', r: 320 }, { n: 99, s: '27.5x38x40', r: 340 },
    { n: 100, s: '27x38x40', r: 360 }, { n: 101, s: '30x38x30', r: 190 }, { n: 102, s: '29.5x38x30', r: 200 },
    { n: 103, s: '29x38x30', r: 210 }, { n: 104, s: '28.5x38x30', r: 220 }, { n: 105, s: '28x38x30', r: 230 },
    { n: 106, s: '27.5x38x30', r: 240 }, { n: 107, s: '27x38x30', r: 250 }, { n: 108, s: '27x36x40', r: 240 },
    { n: 109, s: '26.5x36x40', r: 255 }, { n: 110, s: '26x36x40', r: 270 }, { n: 111, s: '25.5x36x40', r: 285 },
    { n: 112, s: '25x36x40', r: 300 }, { n: 113, s: '24.5x36x40', r: 315 }, { n: 114, s: '24x36x40', r: 330 },
    { n: 115, s: '30x36x24', r: 120 }, { n: 116, s: '29.5x36x24', r: 130 }, { n: 117, s: '29x36x24', r: 140 },
    { n: 118, s: '28.5x36x24', r: 145 }, { n: 119, s: '28x36x24', r: 150 }, { n: 120, s: '27.5x36x24', r: 160 },
    { n: 121, s: '27x36x24', r: 165 }, { n: 122, s: '26.5x36x24', r: 165 }, { n: 123, s: '26x36x24', r: 170 },
    { n: 124, s: '25.5x36x24', r: 180 }, { n: 125, s: '25x36x24', r: 190 }, { n: 126, s: '24.5x36x24', r: 200 },
    { n: 127, s: '24x36x24', r: 210 }, { n: 128, s: '23.5x36x24', r: 220 }, { n: 129, s: '23x36x24', r: 230 },
    { n: 130, s: '25x36x20', r: 160 }, { n: 131, s: '26.5x32x40', r: 170 }, { n: 132, s: '26x32x40', r: 180 },
    { n: 133, s: '25.5x32x40', r: 190 }, { n: 134, s: '25x32x40', r: 210 }, { n: 135, s: '24.5x32x40', r: 230 },
    { n: 136, s: '24x32x40', r: 250 }, { n: 137, s: '23.5x32x40', r: 260 }, { n: 138, s: '23x32x40', r: 280 },
    { n: 139, s: '27x32x24', r: 96 }, { n: 140, s: '26.5x32x24', r: 100 }, { n: 141, s: '26x32x24', r: 105 },
    { n: 142, s: '25.5x32x24', r: 110 }, { n: 143, s: '25x32x24', r: 115 }, { n: 144, s: '24.5x32x24', r: 120 },
    { n: 145, s: '24x32x24', r: 125 }, { n: 146, s: '23.5x32x24', r: 130 }, { n: 147, s: '23x32x24', r: 140 },
    { n: 148, s: '22.5x32x24', r: 150 }, { n: 149, s: '21x30x18', r: 96 }, { n: 150, s: '20.5x30x18', r: 104 },
    { n: 151, s: '20x30x18', r: 110 }, { n: 152, s: '19.5x30x18', r: 116 }, { n: 153, s: '19x30x18', r: 122 },
    { n: 154, s: '18.5x30x18', r: 128 }, { n: 155, s: '18x30x18', r: 132 }, { n: 156, s: '18x28x30', r: 160 },
    { n: 157, s: '17.5x28x30', r: 170 }, { n: 158, s: '17x28x30', r: 180 }, { n: 159, s: '21x28x18', r: 90 },
    { n: 160, s: '20.5x28x18', r: 96 }, { n: 161, s: '20x28x18', r: 104 }, { n: 162, s: '19.5x28x18', r: 110 },
    { n: 163, s: '19x28x18', r: 116 }, { n: 164, s: '18.5x28x18', r: 122 }, { n: 165, s: '18x28x18', r: 128 },
    { n: 166, s: '18x25x25', r: 96 }, { n: 167, s: '17.5x25x25', r: 110 }, { n: 168, s: '17x25x25', r: 120 },
    { n: 169, s: '18x25x15', r: 70 },
  ];
  lbBushData.forEach((b) => addItem('lb_bush', b.n.toString(), `L.B. BUSH ${b.s}`, b.r, 'Victor'));

  // Raj & Raj Rubber Bush (1 to 16)
  const rajRubber = [
    { n: '1', s: '15x25x15 to 20x25x15', r: 32.0 },
    { n: '2', s: '18x27x20 to 20x27x20', r: 34.0 },
    { n: '3', s: '18x28x20 to 21x28x18', r: 32.0 },
    { n: '4', s: '18x30x20 to 22x30x20', r: 34.0 },
    { n: '5', s: '18x32x24 to 25x32x24', r: 40.0 },
    { n: '6', s: '21x36x24 to 24x36x24', r: 44.0 },
    { n: '7', s: '25x36x24 to 28x36x24', r: 40.0 },
    { n: '8', s: '25x36x15 to 28x36x15', r: 32.0 },
    { n: '9', s: '25x38x24 to 28x38x24', r: 50.0 },
    { n: '10', s: '25x38x30 to 28x38x30', r: 55.0 },
    { n: '11', s: '26x40x25 to 30x40x25', r: 55.0 },
    { n: '12', s: '27x42x30 to 32x42x30', r: 60.0 },
    { n: '13', s: '27x27x20', r: 40.0 },
    { n: '14', s: '32x45x35 to 35x45x35', r: 72.0 },
    { n: '15', s: '35x48x40 to 38x48x40', r: 80.0 },
    { n: '16', s: '33x50x40 to 38x50x40', r: 80.0 },
  ];
  rajRubber.forEach((r) => addItem('raj_rubber_bush', r.n, `Raj & Raj Rubber Bush ${r.s}`, r.r, 'Raj & Raj'));

  // Tefcot Rubber Bush (1 to 8)
  const tefcotRubber = [
    { n: '1', s: '18 x 28 x 18', r: 90.0 },
    { n: '2', s: '21 x 30 x 18', r: 90.0 },
    { n: '3', s: '24 to 28 x 36 x 24', r: 56.0 },
    { n: '4', s: '27 x 42 x 20CL', r: 120.0 },
    { n: '5', s: '27 to 30 x 42 x 30', r: 150.0 },
    { n: '6', s: '32 to 37 x 45 x 35', r: 190.0 },
    { n: '7', s: '35 to 38 x 48 x 40', r: 220.0 },
    { n: '8', s: '35 to 38 x 50 x 40', r: 220.0 },
  ];
  tefcotRubber.forEach((r) => addItem('tefcot_rubber_bush', r.n, `Tefcot Rubber Bush ${r.s}`, r.r, 'Tefcot'));

  // Dura Rubber Bush (1 to 8)
  const duraRubber = [
    { n: '1', s: '18 x 25 x 15', r: 46.0 },
    { n: '2', s: '18 to 21 x 28 x 18', r: 46.0 },
    { n: '3', s: '18 to 21 x 30 x 18', r: 46.0 },
    { n: '4', s: '24 to 28 x 36 x 15', r: 50.0 },
    { n: '5', s: '24 to 28 x 36 x 24', r: 60.0 },
    { n: '6', s: '27 x 42 x 20', r: 60.0 },
    { n: '7', s: '27 to 30 x 42 x 30', r: 80.0 },
    { n: '8', s: '36 to 38 x 50 x 40', r: 120.0 },
  ];
  duraRubber.forEach((r) => addItem('dura_rubber_bush', r.n, `Dura Rubber Bush ${r.s}`, r.r, 'Dura'));

  // ─── 5. DIFFUSER (BOWL) & IMPELLER ──────────────────────────────────────────
  // V-4 HF (19 items)
  const v4HfData = [
    { n: '1', code: 'Ppi-HF-01', spec: '23x81x7x6x14', r: 52.0 },
    { n: '2', code: 'Ppi-HF-02', spec: '23x81x7x6x14', r: 52.0 },
    { n: '3', code: 'Ppi-HF-02', spec: '23x81x8x6x14', r: 52.0 },
    { n: '4', code: 'Ppi-HF-04', spec: '25x81x7x6x14', r: 52.0 },
    { n: '5', code: 'Ppi-HF-04', spec: '25x81x8x6x14', r: 52.0 },
    { n: '6', code: 'Ppi-HF-04', spec: '25.5x81x7x6x14', r: 52.0 },
    { n: '7', code: 'Ppi-HF-04', spec: '25.5x81x8x6x14', r: 52.0 },
    { n: '8', code: 'Ppi-HF-05', spec: '30x81x7x6x14', r: 56.0 },
    { n: '9', code: 'Ppi-HF-05', spec: '30x81x8x6x14', r: 56.0 },
    { n: '10', code: 'Ppi-HF-05', spec: '34x81x7x14', r: 56.0 },
    { n: '11', code: 'Ppi-HF-05', spec: '34x81x8x14', r: 56.0 },
    { n: '12', code: 'Ppi-HF-07', spec: '34x81x7x6x14', r: 56.0 },
    { n: '13', code: 'Ppi-HF-07', spec: '34x81x8x6x14', r: 56.0 },
    { n: '14', code: 'Ppi-HF-10', spec: '38x81x7x6x14', r: 60.0 },
    { n: '15', code: 'Ppi-HF-12', spec: '38x81x6x14', r: 60.0 },
    { n: '16', code: 'Ppi-HF-12', spec: '40x81x6x14', r: 60.0 },
    { n: '17', code: 'Ppi-HF-15', spec: '50x81x8x6x14', r: 80.0 },
    { n: '18', code: 'Ppi-HF-18', spec: '54x81x8x6x14', r: 90.0 },
    { n: '19', code: 'Ppi-HF-30', spec: '75x81x7x7x14', r: 200.0 },
  ];
  v4HfData.forEach((i) => {
    addItem('v4_hf', `${i.n}.1`, `${i.code} ${i.spec} - Set`, i.r, 'PPI', i.code, 'set');
    addItem('v4_hf', `${i.n}.2`, `${i.code} ${i.spec} - Bowl`, Math.round(i.r * 0.55), 'PPI', i.code);
    addItem('v4_hf', `${i.n}.3`, `${i.code} ${i.spec} - Impeller`, Math.round(i.r * 0.45), 'PPI', i.code);
  });

  // V-4 HH (9 items)
  const v4HhData = [
    { n: '20', code: 'Ppi-HH-00', spec: '21x81x6x5x14', r: 52.0 },
    { n: '21', code: 'Ppi-HH-01', spec: '23x81x6x5x14', r: 52.0 },
    { n: '22', code: 'Ppi-HH-02', spec: '23x81x6x5x14', r: 52.0 },
    { n: '23', code: 'Ppi-HH-02', spec: '23x81.5x6x5x14', r: 52.0 },
    { n: '24', code: 'Ppi-HH-04', spec: '25x81x5x14', r: 52.0 },
    { n: '25', code: 'Ppi-HH-05', spec: '30x81x6x5x14', r: 56.0 },
    { n: '26', code: 'Ppi-HH-05', spec: '34x81x6x5x14', r: 56.0 },
    { n: '27', code: 'Ppi-HH-07', spec: '34x81x6x5x14', r: 56.0 },
    { n: '28', code: 'Ppi-HH-10', spec: '38x81x6x5x14', r: 60.0 },
  ];
  v4HhData.forEach((i) => {
    addItem('v4_hh', `${i.n}.1`, `${i.code} ${i.spec} - Set`, i.r, 'PPI', i.code, 'set');
    addItem('v4_hh', `${i.n}.2`, `${i.code} ${i.spec} - Bowl`, Math.round(i.r * 0.55), 'PPI', i.code);
    addItem('v4_hh', `${i.n}.3`, `${i.code} ${i.spec} - Impeller`, Math.round(i.r * 0.45), 'PPI', i.code);
  });

  // Diffuser Accessories (29 to 34)
  addItem('diffuser_accessory', '29.1', 'Ppi-V4.SP Suction Plate 16.3 - Set', 52.0, 'PPI', 'Ppi-V4.SP', 'set');
  addItem('diffuser_accessory', '30.1', 'Ppi-V4.DP OD 81mm (Middle) (Bush ID:30mm) 30 - Set', 60.0, 'PPI', 'Ppi-V4.DP', 'set');
  addItem('diffuser_accessory', '31.1', 'Ppi-R.SP Suction Plate - Set', 16.0, 'PPI', 'Ppi-R.SP', 'set');
  addItem('diffuser_accessory', '32.1', 'Ppi-R.DP OD 85 & 86mm (Middle) (Bush ID:30mm) 30 & 34 - Set', 90.0, 'PPI', 'Ppi-R.DP', 'set');
  addItem('diffuser_accessory', '33.1', 'Ppi-V3.SP Suction Plate 21.7 - Set', 50.0, 'PPI', 'Ppi-V3.SP', 'set');
  addItem('diffuser_accessory', '34.1', 'Ppi-V3.DP OD 70mm (Middle) (Bush ID:25 & 28mm) 23 & 30', 60.0, 'PPI', 'Ppi-V3.DP', 'set');

  // R-Series HH (17 items)
  const rSeriesData = [
    { n: '1', code: 'Ppi-R.HH-01', spec: '25.5 & 24 x 86 x 6 x 5 x 14', r: 84.0 },
    { n: '2', code: 'Ppi-R.HH-01', spec: '25.5 & 24 x 85 x 5 x 14', r: 84.0 },
    { n: '3', code: 'Ppi-R.HH-01A', spec: '25.5/24/22 x 86 x 6 x 5 x 14', r: 84.0 },
    { n: '4', code: 'Ppi-R.HH-01A', spec: '25.5/24/22 x 85 x 14', r: 84.0 },
    { n: '5', code: 'Ppi-R.HH-J6', spec: '24 x 86 & 85 x 14', r: 84.0 },
    { n: '6', code: 'Ppi-R.HH-02', spec: '29.5 & 28 x 86 x 5 x 14', r: 84.0 },
    { n: '7', code: 'Ppi-R.HH-02', spec: '29.5 & 28 x 85 x 5 x 14', r: 84.0 },
    { n: '8', code: 'Ppi-R.HH-03', spec: '29.5 & 28 x 86 x 14', r: 84.0 },
    { n: '9', code: 'Ppi-R.HH-03', spec: '29.5 & 28 x 85 x 14', r: 84.0 },
    { n: '10', code: 'Ppi-R.HH-04', spec: '29.5 & 28 x 86 x 5 x 14', r: 84.0 },
    { n: '11', code: 'Ppi-R.HH-04', spec: '29.5 & 28 x 85 x 5 x 14', r: 84.0 },
    { n: '12', code: 'Ppi-R.HH-05', spec: '36.3 & 34 x 86 x 6 x 6 x 14', r: 90.0 },
    { n: '13', code: 'Ppi-R.HH-05', spec: '36.3 & 34 x 85 x 14', r: 90.0 },
    { n: '14', code: 'Ppi-R.HH-07', spec: '36.3 & 34 x 86 x 6 x 14', r: 90.0 },
    { n: '15', code: 'Ppi-R.HH-07', spec: '36.3 & 34 x 85 x 6 x 14', r: 90.0 },
    { n: '16', code: 'Ppi-R.HH-09', spec: '36.3 x 86 x 6 x 6 x 14', r: 95.0 },
    { n: '17', code: 'Ppi-R.HH-09', spec: '36.3 x 85 x 14', r: 95.0 },
  ];
  rSeriesData.forEach((i) => {
    addItem('r_series_hh', `${i.n}.1`, `${i.code} ${i.spec} - Set`, i.r, 'PPI', i.code, 'set');
    addItem('r_series_hh', `${i.n}.2`, `${i.code} ${i.spec} - Bowl`, Math.round(i.r * 0.55), 'PPI', i.code);
    addItem('r_series_hh', `${i.n}.3`, `${i.code} ${i.spec} - Impeller`, Math.round(i.r * 0.45), 'PPI', i.code);
  });

  // V-3 HF (6 items)
  const v3HfData = [
    { n: '18', code: 'Ppi-HF-02', spec: '23x70x7x6x12', r: 40.0 },
    { n: '19', code: 'Ppi-HF-04', spec: '23x7x6x12', r: 40.0 },
    { n: '20', code: 'Ppi-HF-04', spec: '25x70x7x6x12', r: 40.0 },
    { n: '21', code: 'Ppi-HF-05', spec: '27x70x7x6x12', r: 44.0 },
    { n: '22', code: 'Ppi-HF-07', spec: '27x70x7x6x12', r: 44.0 },
    { n: '23', code: 'Ppi-HF-07', spec: '30x70x7x12', r: 44.0 },
  ];
  v3HfData.forEach((i) => {
    addItem('v3_hf', `${i.n}.1`, `${i.code} ${i.spec} - Set`, i.r, 'PPI', i.code, 'set');
    addItem('v3_hf', `${i.n}.2`, `${i.code} ${i.spec} - Bowl`, Math.round(i.r * 0.55), 'PPI', i.code);
    addItem('v3_hf', `${i.n}.3`, `${i.code} ${i.spec} - Impeller`, Math.round(i.r * 0.45), 'PPI', i.code);
  });

  // ─── 6. STUDS, NUTS, BOLTS & WASHERS ────────────────────────────────────────
  // S.S. 410 Stud
  const ss410Studs = [
    { s: '25 mm', r6: 3.30, r8: 4.10, r10: 0 },
    { s: '30 mm', r6: 3.50, r8: 4.30, r10: 0 },
    { s: '33 mm', r6: 3.70, r8: 4.50, r10: 6.50 },
    { s: '35 mm', r6: 3.80, r8: 4.70, r10: 6.70 },
    { s: '40 mm', r6: 4.40, r8: 5.50, r10: 7.50 },
    { s: '45 mm', r6: 4.60, r8: 6.00, r10: 8.40 },
    { s: '50 mm', r6: 4.90, r8: 6.40, r10: 9.20 },
    { s: '55 mm', r6: 5.20, r8: 6.70, r10: 10.00 },
    { s: '60 mm', r6: 5.70, r8: 7.20, r10: 11.00 },
    { s: '65 mm', r6: 6.20, r8: 8.00, r10: 12.00 },
    { s: '70 mm', r6: 6.50, r8: 8.40, r10: 13.00 },
    { s: '75 mm', r6: 6.80, r8: 8.70, r10: 14.00 },
    { s: '80 mm', r6: 7.20, r8: 9.50, r10: 15.00 },
    { s: '85 mm', r6: 7.60, r8: 10.00, r10: 16.00 },
    { s: '90 mm', r6: 8.00, r8: 10.40, r10: 17.00 },
    { s: '95 mm', r6: 8.40, r8: 11.00, r10: 18.00 },
    { s: '100 mm', r6: 8.70, r8: 12.00, r10: 19.00 },
    { s: '105 mm', r6: 9.20, r8: 13.00, r10: 19.50 },
    { s: '110 mm', r6: 9.60, r8: 13.70, r10: 20.00 },
    { s: '115 mm', r6: 10.00, r8: 14.00, r10: 21.00 },
    { s: '120 mm', r6: 10.50, r8: 15.00, r10: 22.00 },
    { s: '125 mm', r6: 11.00, r8: 16.00, r10: 23.00 },
    { s: '130 mm', r6: 12.00, r8: 17.00, r10: 24.00 },
    { s: '140 mm', r6: 13.60, r8: 18.00, r10: 26.00 },
    { s: '150 mm', r6: 15.00, r8: 20.00, r10: 28.00 },
  ];
  ss410Studs.forEach((st, idx) => {
    if (st.r6 > 0) addItem('ss_410_stud', `${idx + 1}.1`, `S.S. 410 Stud 6 M.M. x ${st.s}`, st.r6, 'Kun');
    if (st.r8 > 0) addItem('ss_410_stud', `${idx + 1}.2`, `S.S. 410 Stud 8 M.M. x ${st.s}`, st.r8, 'Kun');
    if (st.r10 > 0) addItem('ss_410_stud', `${idx + 1}.3`, `S.S. 410 Stud 10 M.M. x ${st.s}`, st.r10, 'Kun');
  });

  // S.S. Hex Bolt AISI 202
  const hexBolts = [
    { s: '1/2"', r14: 3.40, r516: 5.70, r38: 9.90, r12: 0 },
    { s: '3/4"', r14: 4.00, r516: 6.50, r38: 10.50, r12: 0 },
    { s: '1"', r14: 4.75, r516: 7.20, r38: 11.10, r12: 23.00 },
    { s: '1-1/4"', r14: 5.68, r516: 8.30, r38: 12.84, r12: 25.00 },
    { s: '1-1/2"', r14: 6.10, r516: 9.30, r38: 14.20, r12: 27.42 },
    { s: '2"', r14: 7.60, r516: 11.30, r38: 17.10, r12: 33.16 },
    { s: '2-1/2"', r14: 9.19, r516: 13.62, r38: 21.10, r12: 40.60 },
    { s: '3"', r14: 12.20, r516: 16.53, r38: 23.30, r12: 46.00 },
    { s: '3-1/2"', r14: 0, r516: 18.65, r38: 26.20, r12: 51.00 },
    { s: '4"', r14: 0, r516: 20.92, r38: 30.60, r12: 59.00 },
    { s: '5"', r14: 0, r516: 27.10, r38: 41.10, r12: 70.90 },
    { s: '6"', r14: 0, r516: 0, r38: 50.47, r12: 81.00 },
  ];
  hexBolts.forEach((b, idx) => {
    if (b.r14 > 0) addItem('ss_hex_bolt', `${idx + 1}.1`, `S.S. Hex Bolt 1/4" x ${b.s}`, b.r14, 'Kun');
    if (b.r516 > 0) addItem('ss_hex_bolt', `${idx + 1}.2`, `S.S. Hex Bolt 5/16" x ${b.s}`, b.r516, 'Kun');
    if (b.r38 > 0) addItem('ss_hex_bolt', `${idx + 1}.3`, `S.S. Hex Bolt 3/8" x ${b.s}`, b.r38, 'Kun');
    if (b.r12 > 0) addItem('ss_hex_bolt', `${idx + 1}.4`, `S.S. Hex Bolt 1/2" x ${b.s}`, b.r12, 'Kun');
  });

  // S.S. Allan Cap 202
  const allanCaps = [
    { l: '10mm', r5: 2.60, r6: 3.20, r8: 0, r10: 0 },
    { l: '15mm', r5: 3.00, r6: 3.60, r8: 6.60, r10: 0 },
    { l: '20mm', r5: 3.80, r6: 4.00, r8: 7.00, r10: 0 },
    { l: '25mm', r5: 4.20, r6: 4.60, r8: 8.00, r10: 16.00 },
    { l: '30mm', r5: 4.90, r6: 5.30, r8: 9.00, r10: 18.00 },
    { l: '35mm', r5: 5.30, r6: 6.00, r8: 10.00, r10: 20.00 },
    { l: '40mm', r5: 6.00, r6: 6.80, r8: 11.00, r10: 22.00 },
    { l: '45mm', r5: 6.90, r6: 8.00, r8: 12.00, r10: 24.00 },
    { l: '50mm', r5: 7.20, r6: 9.00, r8: 13.00, r10: 26.00 },
    { l: '60mm', r5: 0, r6: 0, r8: 14.00, r10: 28.00 },
  ];
  allanCaps.forEach((ac, idx) => {
    if (ac.r5 > 0) addItem('ss_allan_cap', `${idx + 1}.1`, `S.S. Allan Cap 5 MM x ${ac.l}`, ac.r5, 'Kun');
    if (ac.r6 > 0) addItem('ss_allan_cap', `${idx + 1}.2`, `S.S. Allan Cap 6 MM x ${ac.l}`, ac.r6, 'Kun');
    if (ac.r8 > 0) addItem('ss_allan_cap', `${idx + 1}.3`, `S.S. Allan Cap 8 MM x ${ac.l}`, ac.r8, 'Kun');
    if (ac.r10 > 0) addItem('ss_allan_cap', `${idx + 1}.4`, `S.S. Allan Cap 10 MM x ${ac.l}`, ac.r10, 'Kun');
  });

  // S.S. Hex Nut, Screw & Washer
  const nutsAndScrews = [
    { n: '1', name: '6mm S.S. Nut', r: 1.30 },
    { n: '2', name: '8mm S.S. Nut', r: 2.40 },
    { n: '3', name: '10mm S.S. Nut', r: 4.80 },
    { n: '4', name: '12mm S.S. Nut', r: 8.20 },
    { n: '5', name: '1/4 S.S. Nut', r: 2.00 },
    { n: '6', name: '5/16 S.S. Nut', r: 2.40 },
    { n: '7', name: '3/8 S.S. Nut', r: 4.60 },
    { n: '8', name: '1/2 S.S. Nut', r: 13.00 },
    { n: '9', name: '5/8 S.S. Nut', r: 24.00 },
    { n: '10', name: '5x8 S.S. Screw', r: 1.20 },
    { n: '11', name: '5x10 S.S. Screw', r: 1.30 },
    { n: '12', name: '5x15 S.S. Screw', r: 1.90 },
    { n: '13', name: '5x12 CSK S.S. Screw', r: 1.20 },
    { n: '14', name: '5x15 CSK S.S. Screw', r: 1.60 },
    { n: '15', name: '5x20 CSK S.S. Screw', r: 2.00 },
    { n: '16', name: '5x25 CSK S.S. Screw', r: 2.60 },
    { n: '17', name: '6x10 S.S. Screw', r: 2.60 },
    { n: '18', name: '6x15 S.S. Screw', r: 2.90 },
    { n: '19', name: '6x20 S.S. Screw', r: 3.90 },
    { n: '20', name: '5x10 Combination Screw', r: 2.20 },
    { n: '21', name: '6mm S.S. Washer', r: 0.80 },
    { n: '22', name: '8mm S.S. Washer', r: 1.00 },
    { n: '23', name: '10mm S.S. Washer', r: 1.30 },
    { n: '24', name: '12mm S.S. Washer', r: 2.00 },
    { n: '25', name: '8mm Sq. Nuts', r: 7.00 },
    { n: '26', name: '10mm Sq. Nuts', r: 24.00 },
    { n: '27', name: '8mm Lam Sq. Nuts', r: 18.00 },
  ];
  nutsAndScrews.forEach((ns) => addItem('ss_hex_nut_washer', ns.n, ns.name, ns.r, 'Kun'));

  // ─── 7. S.S. SLEEVE & COUPLE ────────────────────────────────────────────────
  // V-6 Pump Sleeve (1 to 49)
  const v6PumpSleeves = [
    { n: 1, s: '18 x 25 x 15', r: 28 }, { n: 2, s: '18 x 25 x 18', r: 33 }, { n: 3, s: '18 x 25 x 20', r: 34 },
    { n: 4, s: '18 x 25 x 22', r: 36 }, { n: 5, s: '18 x 25 x 25', r: 36 }, { n: 6, s: '18 x 25 x 30', r: 44 },
    { n: 7, s: '18 x 25 x 31', r: 44 }, { n: 8, s: '18 x 25 x 35', r: 46 }, { n: 9, s: '18 x 25 x 40', r: 52 },
    { n: 10, s: '18 x 25 x 45', r: 58 }, { n: 11, s: '18 x 25 x 50', r: 62 }, { n: 12, s: '18 x 25 x 55', r: 68 },
    { n: 13, s: '18 x 25 x 60', r: 72 }, { n: 14, s: '18 x 25 x 62', r: 72 }, { n: 15, s: '18 x 25 x 70', r: 80 },
    { n: 16, s: '18 x 25 x 72', r: 92 }, { n: 17, s: '20 x 27 x 10', r: 22 }, { n: 18, s: '20 x 27 x 15', r: 26 },
    { n: 19, s: '20 x 27 x 18', r: 27 }, { n: 20, s: '20 x 27 x 20', r: 34 }, { n: 21, s: '20 x 27 x 22', r: 38 },
    { n: 22, s: '20 x 27 x 25', r: 39 }, { n: 23, s: '20 x 27 x 30', r: 46 }, { n: 24, s: '20 x 27 x 31', r: 47 },
    { n: 25, s: '20 x 27 x 35', r: 52 }, { n: 26, s: '20 x 27 x 40', r: 58 }, { n: 27, s: '20 x 27 x 45', r: 62 },
    { n: 28, s: '20 x 27 x 50', r: 68 }, { n: 29, s: '20 x 27 x 55', r: 74 }, { n: 30, s: '20 x 27 x 60', r: 80 },
    { n: 31, s: '20 x 27 x 62', r: 83 }, { n: 32, s: '20 x 27 x 65', r: 88 }, { n: 33, s: '20 x 27 x 70', r: 92 },
    { n: 34, s: '20 x 27 x 72', r: 94 }, { n: 35, s: '20 x 27 x 75', r: 101 }, { n: 36, s: '20 x 27 x 80', r: 106 },
    { n: 37, s: '20 x 30 x 15', r: 36 }, { n: 38, s: '20 x 30 x 16', r: 37 }, { n: 39, s: '20 x 30 x 18', r: 39 },
    { n: 40, s: '20 x 30 x 20', r: 40 }, { n: 41, s: '20 x 30 x 22', r: 42 }, { n: 42, s: '20 x 30 x 25', r: 46 },
    { n: 43, s: '20 x 30 x 30', r: 56 }, { n: 44, s: '20 x 30 x 35', r: 62 }, { n: 45, s: '20 x 30 x 40', r: 70 },
    { n: 46, s: '20 x 30 x 45', r: 80 }, { n: 47, s: '20 x 30 x 50', r: 90 }, { n: 48, s: '20 x 30 x 55', r: 100 },
    { n: 49, s: '20 x 30 x 62', r: 120 },
  ];
  v6PumpSleeves.forEach((s) => addItem('v6_pump_sleeve', s.n.toString(), `V-6 Pump Sleeve ${s.s}`, s.r));

  // V-6 Motor Couple (1 to 16)
  const v6MotorCouples = [
    { n: 1, s: '25 x 39 x 60', r: 150 }, { n: 2, s: '25 x 39 x 65', r: 160 }, { n: 3, s: '25 x 39 x 70', r: 170 },
    { n: 4, s: '25 x 39 x 75', r: 180 }, { n: 5, s: '25 x 39 x 80', r: 190 }, { n: 6, s: '25 x 39 x 85', r: 200 },
    { n: 7, s: '25 x 39 x 90', r: 210 }, { n: 8, s: '25 x 39 x 95', r: 220 }, { n: 9, s: '25 x 39 x 100', r: 230 },
    { n: 10, s: '25 x 44 x 70', r: 220 }, { n: 11, s: '25 x 44 x 75', r: 240 }, { n: 12, s: '25 x 44 x 80', r: 260 },
    { n: 13, s: '25 x 44 x 85', r: 280 }, { n: 14, s: '25 x 44 x 90', r: 300 }, { n: 15, s: '25 x 44 x 95', r: 320 },
    { n: 16, s: '25 x 44 x 100', r: 340 },
  ];
  v6MotorCouples.forEach((c) => addItem('v6_motor_couple', c.n.toString(), `V-6 Motor Couple ${c.s}`, c.r));

  // V-4 Pump Sleeve (1 to 24)
  const v4PumpSleeves = [
    { n: 1, s: '14 x 18 x 20 (14 Holl + 18 D.M. Half Key)', r: 20 },
    { n: 2, s: '14 x 18 x 25 (14 Holl + 18 D.M. Half Key)', r: 22 },
    { n: 3, s: '14 x 18 x 30 (14 Holl + 18 D.M. Half Key)', r: 24 },
    { n: 4, s: '14 x 18 x 35 (14 Holl + 18 D.M. Half Key)', r: 27 },
    { n: 5, s: '14 x 18 x 40 (14 Holl + 18 D.M. Half Key)', r: 32 },
    { n: 6, s: '14 x 18 x 45 (14 Holl + 18 D.M. Half Key)', r: 36 },
    { n: 7, s: '14 x 18 x 50 (14 Holl + 18 D.M. Half Key)', r: 40 },
    { n: 8, s: '14 x 20 x 20 (14 Holl + 20 D.M. Full Key)', r: 28 },
    { n: 9, s: '14 x 20 x 25 (14 Holl + 20 D.M. Full Key)', r: 30 },
    { n: 10, s: '14 x 20 x 30 (14 Holl + 20 D.M. Full Key)', r: 32 },
    { n: 11, s: '14 x 20 x 35 (14 Holl + 20 D.M. Full Key)', r: 36 },
    { n: 12, s: '14 x 20 x 40 (14 Holl + 20 D.M. Full Key)', r: 40 },
    { n: 13, s: '14 x 20 x 45 (14 Holl + 20 D.M. Full Key)', r: 46 },
    { n: 14, s: '14 x 20 x 50 (14 Holl + 20 D.M. Full Key)', r: 52 },
    { n: 15, s: '14 x 21 x 20 (14 Holl + 21 D.M. Full Key)', r: 28 },
    { n: 16, s: '14 x 21 x 25 (14 Holl + 21 D.M. Full Key)', r: 30 },
    { n: 17, s: '14 x 21 x 30 (14 Holl + 21 D.M. Full Key)', r: 32 },
    { n: 18, s: '14 x 21 x 35 (14 Holl + 21 D.M. Full Key)', r: 36 },
    { n: 19, s: '14 x 21 x 40 (14 Holl + 21 D.M. Full Key)', r: 40 },
    { n: 20, s: '14 x 21 x 45 (14 Holl + 21 D.M. Full Key)', r: 46 },
    { n: 21, s: '14 x 21 x 50 (14 Holl + 21 D.M. Full Key)', r: 52 },
    { n: 22, s: '12 x 18 x 25 (12 Holl + 18 D.M. Full Key)', r: 30 },
    { n: 23, s: '12 x 18 x 30 (12 Holl + 18 D.M. Full Key)', r: 32 },
    { n: 24, s: '12 x 18 x 35 (12 Holl + 18 D.M. Full Key)', r: 40 },
  ];
  v4PumpSleeves.forEach((s) => addItem('v4_pump_sleeve', s.n.toString(), `V-4 Pump Sleeve ${s.s}`, s.r));

  // Rotor Sleeve (1 to 10)
  const rotorSleeves = [
    { n: 1, s: '22 x 28 x 40', r: 70 }, { n: 2, s: '25 x 32 x 50', r: 90 }, { n: 3, s: '28 x 36 x 25', r: 70 },
    { n: 4, s: '28 x 36 x 50', r: 100 }, { n: 5, s: '31 x 40 x 50', r: 120 }, { n: 6, s: '32 x 40 x 50', r: 120 },
    { n: 7, s: '32 x 40 x 60', r: 140 }, { n: 8, s: '32 x 40 x 70', r: 160 }, { n: 9, s: '32 x 40 x 80', r: 180 },
    { n: 10, s: '32 x 40 x 100', r: 220 },
  ];
  rotorSleeves.forEach((s) => addItem('rotor_sleeve', s.n.toString(), `Rotor Sleeve ${s.s}`, s.r));

  // ─── 8. S.S. KEY 410, S.S./C.I. BOWL & IMPELLER ────────────────────────────
  const ssKeyData = [
    { l: '10 mm', r: 2.40 }, { l: '15 mm', r: 2.80 }, { l: '20 mm', r: 3.00 }, { l: '25 mm', r: 3.80 },
    { l: '30 mm', r: 4.70 }, { l: '35 mm', r: 4.70 }, { l: '40 mm', r: 5.50 }, { l: '45 mm', r: 5.90 },
    { l: '50 mm', r: 6.20 }, { l: '55 mm', r: 7.10 }, { l: '60 mm', r: 10.60 }, { l: '65 mm', r: 14.20 },
    { l: '70 mm', r: 15.30 }, { l: '75 mm', r: 16.80 }, { l: '80 mm', r: 20.00 }, { l: '85 mm', r: 21.50 },
    { l: '90 mm', r: 22.50 }, { l: '95 mm', r: 23.60 }, { l: '100 mm', r: 14.00 }, { l: '300 mm', r: 28.00 },
  ];
  ssKeyData.forEach((k, idx) => addItem('ss_key_410', (idx + 1).toString(), `S.S. Key 410 - Length ${k.l}`, k.r));

  // S.S. Bowl & Impeller Set
  const ssBowlSets = [
    { s: '60 (32mm)', bowl: 1100, imp: 340, set: 1400 },
    { s: '80 (37mm)', bowl: 1200, imp: 360, set: 1560 },
    { s: '100 (40mm)', bowl: 1300, imp: 360, set: 1660 },
    { s: '125 (44mm)', bowl: 1400, imp: 400, set: 1800 },
    { s: '150 (48mm)', bowl: 1500, imp: 420, set: 1920 },
    { s: '200 (55mm)', bowl: 1600, imp: 440, set: 2040 },
  ];
  ssBowlSets.forEach((b, idx) => {
    addItem('ss_bowl_impeller_set', `${idx + 1}.1`, `S.S. Bowl & Impeller Set ${b.s}`, b.set, 'J.K. Spares', undefined, 'set');
    addItem('ss_bowl_impeller_set', `${idx + 1}.2`, `S.S. Bowl ${b.s}`, b.bowl);
    addItem('ss_bowl_impeller_set', `${idx + 1}.3`, `S.S. Impeller 410 ${b.s}`, b.imp);
  });

  // C.I. Bowl & PVC Impeller Set
  const ciBowlSets = [
    { s: '60 (32mm)', bowl: 380, imp: 160, set: 540 },
    { s: '80 (37mm)', bowl: 380, imp: 160, set: 540 },
    { s: '100 (40mm)', bowl: 380, imp: 160, set: 540 },
    { s: '125 (44mm)', bowl: 400, imp: 190, set: 590 },
    { s: '150 (48mm)', bowl: 420, imp: 200, set: 620 },
    { s: '200 (55mm)', bowl: 440, imp: 210, set: 650 },
  ];
  ciBowlSets.forEach((b, idx) => {
    addItem('ci_bowl_pvc_impeller_set', `${idx + 1}.1`, `C.I. Bowl & PVC Impeller Set ${b.s}`, b.set, 'J.K. Spares', undefined, 'set');
    addItem('ci_bowl_pvc_impeller_set', `${idx + 1}.2`, `C.I. Bowl ${b.s}`, b.bowl);
    addItem('ci_bowl_pvc_impeller_set', `${idx + 1}.3`, `PVC Impeller ${b.s}`, b.imp);
  });

  // ─── 9. S.S. SUBMERSIBLE PUMP PARTS & HARDWARE ──────────────────────────────
  const drainPlugs = [
    { n: '1', name: 'V3 / V4 Drain Plug (5 x 16)', r: 4.80 },
    { n: '2', name: 'V4 Drain Plug 8mm Thread', r: 5.50 },
    { n: '3', name: 'V4 Drain Plug 10mm Thread', r: 10.00 },
    { n: '4', name: 'V4 Drain Plug 1/8 BSP', r: 10.00 },
    { n: '5', name: 'Mini Openwell Drain Plug (1/4)', r: 10.00 },
    { n: '6', name: 'Mini Openwell Drain Plug (1/4) (Heavy)', r: 16.50 },
    { n: '7', name: 'Openwell Drain Plug (3/8)', r: 17.00 },
    { n: '8', name: 'V6 1/2 Drain Plug', r: 28.00 },
  ];
  drainPlugs.forEach((d) => addItem('drain_plug', d.n, d.name, d.r));

  const rockerSupports = [
    { n: '1', name: 'V-4 Rocker Support 7 x 15', r: 8.00 },
    { n: '2', name: 'V-4 Rocker Support 8 x 15', r: 8.00 },
    { n: '3', name: 'V-4 Rocker Support 9 x 15', r: 8.00 },
    { n: '4', name: 'V-4 Rocker Support 10 x 15', r: 8.40 },
    { n: '5', name: 'V-4 Rocker Support 11 x 15', r: 8.80 },
    { n: '6', name: 'V-4 Rocker Support 12 x 15', r: 9.20 },
    { n: '7', name: 'V-4 Rocker Support 13 x 15', r: 9.60 },
    { n: '8', name: 'V-4 Rocker Support 14 x 15', r: 10.00 },
    { n: '9', name: 'V-4 Rocker Support 15 x 15', r: 10.50 },
    { n: '10', name: 'V-6 Rocker Support 9 x 20', r: 16.00 },
    { n: '11', name: 'V-6 Rocker Support 10 x 20', r: 17.00 },
    { n: '12', name: 'V-6 Rocker Support 11 x 20', r: 18.00 },
    { n: '13', name: 'V-6 Rocker Support 12 x 20', r: 19.00 },
    { n: '14', name: 'V-6 Rocker Support 13 x 20', r: 20.00 },
    { n: '15', name: 'V-6 Rocker Support 14 x 20', r: 21.00 },
    { n: '16', name: 'V-6 Rocker Support 15 x 20', r: 22.00 },
    { n: '17', name: 'V-6 Rocker Support 18 x 20', r: 26.00 },
    { n: '18', name: 'V-6 Rocker Support 20 x 20', r: 28.00 },
  ];
  rockerSupports.forEach((r) => addItem('ss_rocker_support', r.n, r.name, r.r));

  addItem('top_washer', '1', 'V3 Top Washer (12 x 18)', 6.80);
  addItem('top_washer', '2', 'V4 Top Washer (14 x 19)', 7.60);
  addItem('top_washer', '3', 'V6 Top Washer (18 x 24)', 12.50);
  addItem('top_washer', '4', 'V6 Top Washer (20 x 29)', 18.00);

  const brassSsParts = [
    { n: '1', name: '12 mm 0.5 (S.S. Washer)', r: 0.50 },
    { n: '2', name: '14 mm 0.5 (S.S. Washer)', r: 0.50 },
    { n: '3', name: '18 mm 0.5 (S.S. Washer)', r: 1.00 },
    { n: '4', name: '18 mm 1.0 (S.S. Washer)', r: 1.20 },
    { n: '5', name: '20 mm 0.5 (S.S. Washer)', r: 1.20 },
    { n: '6', name: '20 mm 1.0 (S.S. Washer)', r: 1.40 },
    { n: '7', name: '24 mm 0.5 (S.S. Washer)', r: 1.60 },
    { n: '8', name: '24 mm 1.0 (S.S. Washer)', r: 2.00 },
    { n: '9', name: '25 mm 0.5 (S.S. Washer)', r: 1.60 },
    { n: '10', name: '25 mm 1.0 (S.S. Washer)', r: 2.00 },
    { n: '11', name: '28 mm 0.5 (S.S. Washer)', r: 2.00 },
    { n: '12', name: '28 mm 1.0 (S.S. Washer)', r: 2.50 },
    { n: '13', name: '12 mm 0.5 (Brass Washer)', r: 0.90 },
    { n: '14', name: '14 mm 0.5 (Brass Washer)', r: 0.90 },
    { n: '15', name: '15 mm 0.5 (Brass Washer)', r: 2.00 },
    { n: '16', name: '15 mm 1.0 (Brass Washer)', r: 4.00 },
    { n: '17', name: '18 mm 0.5 (Brass Washer)', r: 2.00 },
    { n: '18', name: '18 mm 1.0 (Brass Washer)', r: 4.00 },
    { n: '19', name: '20 mm 0.5 (Brass Washer)', r: 2.20 },
    { n: '20', name: '20 mm 1.0 (Brass Washer)', r: 4.40 },
    { n: '21', name: '24 mm 0.5 (Brass Washer)', r: 3.50 },
    { n: '22', name: '24 mm 1.0 (Brass Washer)', r: 7.00 },
    { n: '23', name: '25 mm 0.5 (Brass Washer)', r: 3.50 },
    { n: '24', name: '25 mm 1.0 (Brass Washer)', r: 7.00 },
    { n: '25', name: 'Mini Cable Flanch (S.S.)', r: 6.00 },
  ];
  brassSsParts.forEach((b) => addItem('brass_ss_parts', b.n, b.name, b.r));

  addItem('spring_washer', '1.1', '6 MM Spring Washer S.S.', 0.70);
  addItem('spring_washer', '1.2', '6 MM Spring Washer M.S.', 0.60);
  addItem('spring_washer', '2.1', '8 MM Spring Washer S.S.', 1.00);
  addItem('spring_washer', '2.2', '8 MM Spring Washer M.S.', 0.80);
  addItem('spring_washer', '3.1', '10 MM Spring Washer S.S.', 1.40);
  addItem('spring_washer', '3.2', '10 MM Spring Washer M.S.', 1.20);
  addItem('spring_washer', '4.1', '12 MM Spring Washer S.S.', 2.00);

  addItem('ss_sand_guard', '1', 'V3 Sand Guard', 26.0);
  addItem('ss_sand_guard', '2', 'V4 Sand Guard', 36.0);
  addItem('ss_sand_guard', '3', 'V6 Sand Guard', 60.0);
  addItem('ss_sand_guard', '4', 'V6 Sand Guard (Falcon Type)', 100.0);

  const pumpCouples = [
    { n: '1', name: 'V3 15 x 18 x 12 x 55 x 25 Pump Couple', r: 110.0 },
    { n: '2', name: 'V3 10 x 15 x 12 x 18 x 40 Pump Couple', r: 100.0 },
    { n: '3', name: 'V4 10.5 x 18/20 x 14 x 21 x 60.5 Pump Couple', r: 120.0 },
    { n: '4', name: 'V4 10.5 x 18/20 x 14 x 25 x 55 Pump Couple', r: 120.0 },
    { n: '5', name: 'V4 10.5 x 18/20 x 25 x 39 x 55x25 (Joint)', r: 145.0 },
    { n: '6', name: 'V4 18 / 20 x 21 x 14 x 31 x 58 (Joint)', r: 120.0 },
    { n: '7', name: 'V4 18 / 20 x 21 x 14 x 31 x 54 (Joint)', r: 120.0 },
    { n: '8', name: 'V6 12.5 x 25 x 20 / 18 x 30 x 85 Pump Couple', r: 190.0 },
    { n: '9', name: 'V6 Teflon Couple (S.S. Pump)', r: 250.0 },
    { n: '10', name: 'V4 18/20 x 21 x 14 x 31 x 65 x 35 (Joint)', r: 146.0 },
    { n: '11', name: 'V4 18/20 x 21 x 14 x 31 x 65 x 30 (Joint)', r: 140.0 },
    { n: '12', name: 'V4 18/20 x 21 x 14 x 30 x 80 x 45 (Joint)', r: 190.0 },
    { n: '13', name: 'V6 25 x 30 x 20 x 80 Plain Couple', r: 160.0 },
    { n: '14', name: 'Capsul 32', r: 56.0 },
    { n: '15', name: 'Capsul 42', r: 84.0 },
    { n: '16', name: 'Capsul 50', r: 110.0 },
    { n: '17', name: 'Capsul + 14 + 32', r: 80.0 },
    { n: '18', name: 'Capsul + 14 + 42 (W)', r: 150.0 },
    { n: '19', name: 'Capsul + 14 + 50 (W)', r: 170.0 },
    { n: '20', name: 'Hex + Capsul + 32', r: 140.0 },
    { n: '21', name: 'Hex + Capsul + 42', r: 170.0 },
    { n: '22', name: 'Hex + Capsul + 50', r: 190.0 },
    { n: '23', name: 'Hex + Milling + 32', r: 140.0 },
    { n: '24', name: 'Hex + Milling + 42', r: 170.0 },
    { n: '25', name: 'Hex + Milling + 50', r: 190.0 },
    { n: '26', name: 'Milling + 14 + 32', r: 130.0 },
    { n: '27', name: 'Milling + 14 + 42', r: 160.0 },
    { n: '28', name: 'Milling + 14 + 50', r: 190.0 },
    { n: '29', name: 'Milling + Hex + 32', r: 140.0 },
    { n: '30', name: 'Milling + Hex + 42', r: 170.0 },
    { n: '31', name: 'Milling + Hex + 50', r: 180.0 },
    { n: '32', name: 'Milling + Capsul + 32', r: 140.0 },
    { n: '33', name: 'Milling + Capsul + 42', r: 170.0 },
    { n: '34', name: 'Milling + Capsul + 50', r: 190.0 },
    { n: '35', name: 'Texmo 14+25+46', r: 85.0 },
    { n: '36', name: 'Texmo Cap + 18 + 46', r: 180.0 },
  ];
  pumpCouples.forEach((p) => addItem('pump_couple_spares', p.n, p.name, p.r));

  const oilSeals = [
    { n: '1', s: '16 to 21 x 30 x 7', r: 17.0 },
    { n: '2', s: '16 to 22 x 32 x 7', r: 18.0 },
    { n: '3', s: '20 to 25 x 35 x 7', r: 19.0 },
    { n: '4', s: '20 to 25 x 36 x 7', r: 20.0 },
    { n: '5', s: '20 to 30 x 40 x 7', r: 20.0 },
    { n: '6', s: '25 to 32 x 42 x 7', r: 21.0 },
    { n: '7', s: '25 to 32 x 45 x 7', r: 22.0 },
    { n: '8', s: '25 to 35 x 47 x 7', r: 23.0 },
    { n: '9', s: '25 to 35 x 48 x 7', r: 24.0 },
    { n: '10', s: '28 to 38 x 50 x 7', r: 25.0 },
    { n: '11', s: '30 to 38 x 55 x 7', r: 25.0 },
    { n: '12', s: '30 to 40 x 60 x 10', r: 30.0 },
    { n: '13', s: '30 to 50 x 62 x 10', r: 30.0 },
  ];
  oilSeals.forEach((o) => addItem('oil_seal_gold_super', o.n, `Gold Super Oil Seal ${o.s}`, o.r, 'Gold Super'));

  addItem('ms_body_lock', '1', 'V3 66 mm Body Lock', 6.0);
  addItem('ms_body_lock', '2', 'V4 85 mm Body Lock', 6.0);
  addItem('ms_body_lock', '3', 'V5 110 mm Body Lock', 13.0);
  addItem('ms_body_lock', '4', 'V6 130 mm Body Lock', 13.0);
  addItem('ms_body_lock', '5', 'V6 137 mm Body Lock', 16.0);
  addItem('ms_body_lock', '6', 'V8 180 mm Body Lock', 60.0);

  const tbLocks = [
    { s: '12 mm', ms: 1.20, ss: 5.00 },
    { s: '14 mm / 15 mm', ms: 1.30, ss: 6.00 },
    { s: '16 mm', ms: 1.40, ss: 6.50 },
    { s: '18 mm', ms: 1.60, ss: 7.00 },
    { s: '20 mm', ms: 1.80, ss: 9.00 },
    { s: '25 mm', ms: 2.00, ss: 13.00 },
    { s: '28 mm', ms: 2.50, ss: 0 },
    { s: '30 mm', ms: 3.00, ss: 0 },
    { s: '32 mm', ms: 3.50, ss: 0 },
    { s: '34 mm', ms: 4.00, ss: 0 },
    { s: '35 mm', ms: 4.20, ss: 0 },
    { s: '36 mm', ms: 4.50, ss: 0 },
    { s: '38 mm', ms: 5.50, ss: 0 },
    { s: '40 mm', ms: 6.00, ss: 0 },
    { s: '42 mm', ms: 6.50, ss: 0 },
  ];
  tbLocks.forEach((l, idx) => {
    addItem('tb_plate_lock', `${idx + 1}.1`, `T.B. Plate Lock ${l.s} M.S.`, l.ms);
    if (l.ss > 0) addItem('tb_plate_lock', `${idx + 1}.2`, `T.B. Plate Lock ${l.s} S.S.`, l.ss);
  });

  addItem('ss_pump_shaft', '1', 'S.S. Pump Shaft V-3 12 mm (Per mm Rate)', 0.44);
  addItem('ss_pump_shaft', '2', 'S.S. Pump Shaft V-4 14 mm (Per mm Rate)', 0.44);
  addItem('ss_pump_shaft', '3', 'S.S. Pump Shaft V-6 18 mm (Per mm Rate)', 0.70);
  addItem('ss_pump_shaft', '4', 'S.S. Pump Shaft V-6 20 mm (Per mm Rate)', 0.80);
  addItem('ss_pump_shaft', '5', 'Wooden Stick 3 x 2', 0.40);
  addItem('ss_pump_shaft', '6', 'Wooden Stick 4 x 2 / 5 x 3', 0.42);
  addItem('ss_pump_shaft', '7', 'Wooden Stick 6 x 3 / 6 x 4', 0.56);
  addItem('ss_pump_shaft', '8', 'Wooden Stick 6 x 5 / 6 x 6 / 6 x 7', 0.64);

  addItem('hook_paper_ring', '1', 'M.S. Hook Mini Openwell (3/8)', 18.0);
  addItem('hook_paper_ring', '2', 'M.S. Hook Openwell (1/2)', 22.0);
  addItem('hook_paper_ring', '3', '3/8 Hook Kadi', 26.0);
  addItem('hook_paper_ring', '4', '1/2 Hook Kadi', 28.0);
  addItem('hook_paper_ring', '5', 'Slot Paper 100 mm to 510 mm (Per Kg.)', 280.0, 'J.K. Spares', undefined, 'kg');
  addItem('hook_paper_ring', '6', 'Paper Roll (Per Kg.)', 300.0, 'J.K. Spares', undefined, 'kg');
  addItem('hook_paper_ring', '7', 'M.S. Stud Ring V3 (Zinc)', 44.0);
  addItem('hook_paper_ring', '8', 'M.S. Stud Ring V4 (Zinc)', 64.0);
  addItem('hook_paper_ring', '9', 'M.S. Stud Ring V6 (Zinc)', 140.0);

  console.log(`Inserting ${itemsToCreate.length} catalog items into Neon PostgreSQL...`);

  // Insert in chunks of 50
  for (let i = 0; i < itemsToCreate.length; i += 50) {
    const chunk = itemsToCreate.slice(i, i + 50);
    await prisma.item.createMany({ data: chunk });
  }

  // 4. Seed initial PriceHistory baseline records for trend charting
  console.log('Seeding initial non-zero baseline price history for trend charts...');
  const createdItems = await prisma.item.findMany({
    select: { id: true, costPrice: true, retailerPrice: true, customerPrice: true },
  });

  const histories = createdItems.map((item) => ({
    itemId: item.id,
    oldCostPrice: item.costPrice,
    newCostPrice: item.costPrice,
    oldRetailerPrice: item.retailerPrice,
    newRetailerPrice: item.retailerPrice,
    oldCustomerPrice: item.customerPrice,
    newCustomerPrice: item.customerPrice,
    changeNote: 'Initial PDF catalog registration',
    changedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago as initial registration baseline
  }));

  for (let i = 0; i < histories.length; i += 50) {
    const chunk = histories.slice(i, i + 50);
    await prisma.priceHistory.createMany({ data: chunk });
  }

  console.log(`✅ Successfully reset database with ${itemsToCreate.length} exact PDF items and non-zero baseline price history!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
