module.exports = {
  WIND: {
    LOW_MAX: 20.0,       // < 20 km/h: Low
    MODERATE_MAX: 35.0,  // 20 - 35 km/h: Moderate
    HIGH_MAX: 50.0,      // 35 - 50 km/h: High
    CRITICAL_MIN: 50.0   // > 50 km/h: Critical
  },
  WAVE: {
    LOW_MAX: 1.5,        // < 1.5 m: Low
    MODERATE_MAX: 2.5,   // 1.5 - 2.5 m: Moderate
    HIGH_MAX: 3.5,       // 2.5 - 3.5 m: High
    CRITICAL_MIN: 3.5    // > 3.5 m: Critical
  },
  VISIBILITY: {
    POOR_KM: 3.0,        // < 3 km: High fog/squall hazard
    MODERATE_KM: 6.0     // 3 - 6 km: Moderate visibility reduction
  },
  WEIGHTS: {
    WAVE: 0.35,
    WIND: 0.25,
    CYCLONE: 0.20,
    VISIBILITY: 0.08,
    LIGHTNING: 0.06,
    GEOFENCE_HAZARD: 0.06
  },
  VESSEL_MODIFIERS: {
    'traditional_unmotorized': 1.35,  // Canoe / Catamaran
    'small_motorized': 1.20,          // Fibre glass craft < 10m
    'mechanized_trawler': 1.00,       // Steel/wooden trawler 10-20m
    'deep_sea_vessel': 0.85           // Industrial vessel > 20m
  }
};
