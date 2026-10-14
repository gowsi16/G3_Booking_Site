/**
 * G3 Transport - Configurable Fleet & Pricing Rules
 *
 * Official Fleet:
 *  - TN 77AY 3006: Heavy Commercial Lorry (Safe Payload Capacity: 8,000 kg / 8 Metric Tons)
 *  - TN28 BF 1256: Medium Commercial Lorry (Safe Payload Capacity: 3,500 kg / 3.5 Metric Tons)
 *
 * Official Drivers:
 *  - Senthil
 *  - Chithiraj
 *  - Prabhu
 */

const FLEET_CONFIG = {
  lorries: {
    "TN 77AY 3006": {
      vehicle_no: "TN 77AY 3006",
      type: "Heavy Commercial Lorry",
      max_capacity_kg: 8000,
      description: "Heavy freight hauler for bulk cargo, sugarcane, steel, & large consignments up to 8 Tons."
    },
    "TN28 BF 1256": {
      vehicle_no: "TN28 BF 1256",
      type: "Medium Commercial Lorry",
      max_capacity_kg: 3500,
      description: "Medium commercial hauler for textiles, FMCG, retail goods, & machinery up to 3.5 Tons."
    }
  },
  max_fleet_capacity_kg: 8000
};

const PRICING_CONFIG = {
  // Base & Distance rules
  baseFare: 1500,            // Base trip start fare (covers first 25 km)
  baseKm: 25,
  ratePerKm: 24,             // Driving highway rate per km beyond 25 km
  minimumFare: 2000,         // Minimum guaranteed transport fare

  // Helper rules (Business rule: ₹800 per helper)
  helperRate: 800,           // 1 helper = ₹800, 2 helpers = ₹1,600, 3 helpers = ₹2,400

  // Weight pricing brackets (normalized to kg)
  // Fixes the bug where 500 kg and 7 tons received the same price!
  weightTiers: [
    { maxKg: 500, label: "Up to 500 kg", surcharge: 0 },
    { maxKg: 1000, label: "Up to 1 Ton (1,000 kg)", surcharge: 1000 },
    { maxKg: 2000, label: "Up to 2 Tons (2,000 kg)", surcharge: 2200 },
    { maxKg: 3500, label: "Up to 3.5 Tons (3,500 kg)", surcharge: 3800 },
    { maxKg: 5000, label: "Up to 5 Tons (5,000 kg)", surcharge: 5500 },
    { maxKg: 7000, label: "Up to 7 Tons (7,000 kg)", surcharge: 7800 },
    { maxKg: 8000, label: "Up to 8 Tons (8,000 kg)", surcharge: 9200 }
  ]
};

/**
 * Normalizes any weight input to integer kilograms.
 * 1 metric ton = 1,000 kg.
 */
function normalizeWeightToKg(rawWeight, unit = "kg") {
  if (typeof rawWeight === "number") {
    return unit === "tons" || unit === "ton" ? Math.round(rawWeight * 1000) : Math.round(rawWeight);
  }

  const str = String(rawWeight || "").toLowerCase().trim();
  if (!str) return 0;

  // Handle formatted strings like "7 Tons", "500 kg", "1.5 Tons"
  if (str.includes("ton")) {
    const numeric = parseFloat(str.replace(/[^0-9.]/g, ""));
    return isNaN(numeric) ? 0 : Math.round(numeric * 1000);
  }

  const numeric = parseFloat(str.replace(/[^0-9.]/g, ""));
  if (isNaN(numeric)) return 0;
  return unit === "tons" ? Math.round(numeric * 1000) : Math.round(numeric);
}

/**
 * Server-side source of truth for transport fare calculation.
 */
function calculateTransportFare({ distanceKm, weightKg, helpers = 0 }) {
  const d = Math.max(1, Math.round(Number(distanceKm) || 0));
  const w = Math.max(0, Math.round(Number(weightKg) || 0));
  const numHelpers = Math.max(0, parseInt(helpers, 10) || 0);

  // 1. Distance charge
  let distanceCharge = PRICING_CONFIG.baseFare;
  const extraKm = Math.max(0, d - PRICING_CONFIG.baseKm);
  if (extraKm > 0) {
    distanceCharge += extraKm * PRICING_CONFIG.ratePerKm;
  }

  // 2. Weight Surcharge
  let weightSurcharge = 0;
  let matchedTier = PRICING_CONFIG.weightTiers[PRICING_CONFIG.weightTiers.length - 1];
  for (const tier of PRICING_CONFIG.weightTiers) {
    if (w <= tier.maxKg) {
      weightSurcharge = tier.surcharge;
      matchedTier = tier;
      break;
    }
  }
  // If weight exceeds 8,000 kg, apply heavy surcharge or note capacity warning
  if (w > 8000) {
    const extraWeight = w - 8000;
    weightSurcharge = 9200 + Math.ceil(extraWeight / 100) * 150;
  }

  // 3. Helper Charge (Strict formula: helpers * 800)
  const helperCharge = numHelpers * PRICING_CONFIG.helperRate;

  // 4. Transport base before helpers
  const transportFareBeforeHelpers = Math.max(PRICING_CONFIG.minimumFare, distanceCharge + weightSurcharge);
  const totalEstimatedFare = transportFareBeforeHelpers + helperCharge;

  return {
    distanceKm: d,
    baseFare: PRICING_CONFIG.baseFare,
    baseKm: PRICING_CONFIG.baseKm,
    extraKm,
    perKmRate: PRICING_CONFIG.ratePerKm,
    distanceCharge,
    weightKg: w,
    weightTierLabel: matchedTier.label,
    weightSurcharge,
    helpers: numHelpers,
    helperRate: PRICING_CONFIG.helperRate,
    helperCharge,
    minimumFare: PRICING_CONFIG.minimumFare,
    totalEstimatedFare: Math.round(totalEstimatedFare),
    isEstimate: true,
    capacityAlert: w > FLEET_CONFIG.max_fleet_capacity_kg 
      ? `Load weight (${w} kg) exceeds maximum lorry capacity (${FLEET_CONFIG.max_fleet_capacity_kg} kg). Admin approval required.`
      : null,
    breakdown: {
      distancePart: `Base ₹${PRICING_CONFIG.baseFare.toLocaleString('en-IN')} (first ${PRICING_CONFIG.baseKm} km) + ${extraKm} km × ₹${PRICING_CONFIG.ratePerKm} = ₹${distanceCharge.toLocaleString('en-IN')}`,
      weightPart: `Weight surcharge (${matchedTier.label}): ₹${weightSurcharge.toLocaleString('en-IN')}`,
      helperPart: numHelpers > 0 ? `${numHelpers} helper(s) × ₹${PRICING_CONFIG.helperRate} = ₹${helperCharge.toLocaleString('en-IN')}` : "₹0 (no helpers)",
      total: `₹${totalEstimatedFare.toLocaleString('en-IN')}`
    }
  };
}

function getPricingConfig() {
  return JSON.parse(JSON.stringify(PRICING_CONFIG));
}

function loadPricingFromDb(db) {
  if (!db) return;
  db.get("SELECT setting_value FROM pricing_settings WHERE setting_key = 'PRICING_CONFIG'", (err, row) => {
    if (!err && row && row.setting_value) {
      try {
        const loaded = JSON.parse(row.setting_value);
        if (loaded.baseFare) PRICING_CONFIG.baseFare = Number(loaded.baseFare);
        if (loaded.baseKm) PRICING_CONFIG.baseKm = Number(loaded.baseKm);
        if (loaded.ratePerKm) PRICING_CONFIG.ratePerKm = Number(loaded.ratePerKm);
        if (loaded.minimumFare) PRICING_CONFIG.minimumFare = Number(loaded.minimumFare);
        if (loaded.helperRate) PRICING_CONFIG.helperRate = Number(loaded.helperRate);
        if (Array.isArray(loaded.weightTiers)) PRICING_CONFIG.weightTiers = loaded.weightTiers;
        console.log('Loaded pricing configuration from database.');
      } catch (e) {
        console.error('Failed to parse pricing_settings:', e);
      }
    }
  });
}

function savePricingToDb(db, newPricing, performedBy = 'Admin', callback) {
  if (!db) return callback && callback(new Error('Database not initialized'));

  // Validate fields
  const baseFare = Number(newPricing.baseFare);
  const baseKm = Number(newPricing.baseKm);
  const ratePerKm = Number(newPricing.ratePerKm);
  const minimumFare = Number(newPricing.minimumFare);
  const helperRate = Number(newPricing.helperRate);

  if (isNaN(baseFare) || isNaN(baseKm) || isNaN(ratePerKm) || isNaN(minimumFare) || isNaN(helperRate)) {
    return callback && callback(new Error('All pricing rate values must be valid numbers'));
  }

  PRICING_CONFIG.baseFare = baseFare;
  PRICING_CONFIG.baseKm = baseKm;
  PRICING_CONFIG.ratePerKm = ratePerKm;
  PRICING_CONFIG.minimumFare = minimumFare;
  PRICING_CONFIG.helperRate = helperRate;
  if (Array.isArray(newPricing.weightTiers)) {
    PRICING_CONFIG.weightTiers = newPricing.weightTiers;
  }

  const jsonStr = JSON.stringify(PRICING_CONFIG);

  db.run(
    `INSERT INTO pricing_settings (setting_key, setting_value, updated_at) 
     VALUES ('PRICING_CONFIG', ?, CURRENT_TIMESTAMP)
     ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP`,
    [jsonStr],
    function(err) {
      if (err) return callback && callback(err);

      // Log to audit_logs
      db.run(
        `INSERT INTO audit_logs (action, details, performed_by) VALUES (?, ?, ?)`,
        [
          'UPDATE_PRICING', 
          `Base: ₹${baseFare}, BaseKm: ${baseKm}, Rate/Km: ₹${ratePerKm}, MinFare: ₹${minimumFare}, HelperRate: ₹${helperRate}`, 
          performedBy
        ],
        () => {
          if (callback) callback(null, PRICING_CONFIG);
        }
      );
    }
  );
}

module.exports = {
  FLEET_CONFIG,
  PRICING_CONFIG,
  getPricingConfig,
  normalizeWeightToKg,
  calculateTransportFare,
  loadPricingFromDb,
  savePricingToDb
};
