// In-memory persistent alert database
let alertsDatabase = [
  {
    id: 'alt_cyclone_01',
    title: 'IMD Red Alert: Deep Depression / Potential Cyclonic Storm',
    type: 'CYCLONE_ALERT',
    severity: 'EMERGENCY',
    sector: 'Mumbai Coast',
    agency: 'India Meteorological Department (IMD Cyclone Division)',
    issuedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 24).toISOString(),
    summary: 'A deep depression over the East-Central Arabian Sea is likely to intensify into a severe cyclonic storm. Squally wind speed reaching 55-65 km/h gusting to 75 km/h is prevailing.',
    recommendedActions: [
      'Total ban on sea venturing for all fishing vessels along Maharashtra & South Gujarat coasts.',
      'Vessels already at deep sea advised to return to nearest safe harbor immediately.',
      'Harbor authorities instructed to hoist Local Warning Signal No. 4.'
    ],
    isBroadcast: true,
    isSimulation: true,
    status: 'ACTIVE'
  },
  {
    id: 'alt_wave_02',
    title: 'INCOIS High Wave Warning: High Swell Waves along Kerala Coast',
    type: 'HIGH_WAVE_WARNING',
    severity: 'WARNING',
    sector: 'Kochi Harbor',
    agency: 'INCOIS Coastal Warning Division, Hyderabad',
    issuedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 18).toISOString(),
    summary: 'High swell waves in the range of 2.8 - 3.4 meters are forecasted along the coast of Kerala from Vizhinjam to Kasargod during the high tide window.',
    recommendedActions: [
      'Artisanal craft and country canoes advised not to venture into deep sea.',
      'Secure small craft with double mooring lines at fish landing centers.',
      'Recreational coastal beach activities prohibited during high tide.'
    ],
    isBroadcast: true,
    isSimulation: true,
    status: 'ACTIVE'
  },
  {
    id: 'alt_port_03',
    title: 'Port Closure Notice: Kasimedu Harbor Entry Restriction',
    type: 'PORT_CLOSURE',
    severity: 'WARNING',
    sector: 'Chennai Offshore',
    agency: 'Directorate General of Shipping / Chennai Port Trust',
    issuedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 12).toISOString(),
    summary: 'Navigational channel dredging and heavy cross-swell at the harbor entrance. Outbound vessel traffic suspended until 06:00 IST tomorrow.',
    recommendedActions: [
      'Maintain position in designated outer anchorage zone.',
      'Monitor VHF Channel 12 for harbor master clearance.'
    ],
    isBroadcast: true,
    isSimulation: true,
    status: 'ACTIVE'
  },
  {
    id: 'alt_light_04',
    title: 'Convective Lightning & Thunder Squall Alert',
    type: 'LIGHTNING_HAZARD',
    severity: 'WATCH',
    sector: 'Visakhapatnam',
    agency: 'IMD Doppler Radar Network, Visakhapatnam',
    issuedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 6).toISOString(),
    summary: 'Moderate to intense convective thunderstorm cells developing 20 NM offshore. Cloud-to-sea lightning strikes detected.',
    recommendedActions: [
      'Vessel crews on open decks advised to lower metallic outriggers.',
      'Disconnect auxiliary antennae not connected to lightning dissipators.'
    ],
    isBroadcast: false,
    isSimulation: true,
    status: 'ACTIVE'
  },
  {
    id: 'alt_adv_05',
    title: 'Routine Spring Tide Hydrodynamic Advisory',
    type: 'GENERAL_ADVISORY',
    severity: 'ADVISORY',
    sector: 'Porbandar',
    agency: 'National Institute of Oceanography (NIO)',
    issuedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 36).toISOString(),
    summary: 'Spring tide tidal range of 3.2m expected during new moon phase. Coastal currents reaching 1.2 m/s in Gulf of Kutch entrance.',
    recommendedActions: [
      'Plan fishing net deployment to account for enhanced tidal drift.'
    ],
    isBroadcast: false,
    isSimulation: true,
    status: 'ACTIVE'
  }
];

class AlertService {
  static getAlerts({ sector, severity, status } = {}) {
    let filtered = [...alertsDatabase];

    if (sector && sector !== 'All') {
      filtered = filtered.filter(a => a.sector === sector || a.sector === 'All Indian Waters');
    }

    if (severity && severity !== 'ALL') {
      filtered = filtered.filter(a => a.severity === severity);
    }

    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }

    // Sort by severity (EMERGENCY -> WARNING -> WATCH -> ADVISORY) then date
    const severityOrder = { EMERGENCY: 1, WARNING: 2, WATCH: 3, ADVISORY: 4 };
    filtered.sort((a, b) => {
      const sDiff = (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5);
      if (sDiff !== 0) return sDiff;
      return new Date(b.issuedAt) - new Date(a.issuedAt);
    });

    return filtered;
  }

  static createAlert(alertData) {
    const newAlert = {
      id: `alt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: alertData.title || 'Marine Emergency Broadcast',
      type: alertData.type || 'GENERAL_ADVISORY',
      severity: alertData.severity || 'WARNING',
      sector: alertData.sector || 'Mumbai Coast',
      agency: alertData.agency || 'ORCA Emergency Broadcast Network',
      issuedAt: new Date().toISOString(),
      expiresAt: alertData.expiresAt || new Date(Date.now() + 3600000 * 24).toISOString(),
      summary: alertData.summary || 'Operational alert broadcast to coastal mariners.',
      recommendedActions: alertData.recommendedActions || ['Monitor VHF Marine Channel 16.'],
      isBroadcast: alertData.isBroadcast ?? true,
      isSimulation: alertData.isSimulation ?? true,
      status: 'ACTIVE'
    };

    alertsDatabase.unshift(newAlert);
    return newAlert;
  }

  static acknowledgeAlert(alertId) {
    const alert = alertsDatabase.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedAt = new Date().toISOString();
      return alert;
    }
    return null;
  }

  static simulateScenario(scenario) {
    if (scenario === 'EMERGENCY_CYCLONE') {
      return this.createAlert({
        title: 'CRITICAL: Severe Cyclone "ORCA-1" Approaching Western Coast',
        type: 'CYCLONE_ALERT',
        severity: 'EMERGENCY',
        sector: 'Mumbai Coast',
        agency: 'National Disaster Management Authority (NDMA) & IMD',
        summary: 'Category 3 Cyclonic Storm with sustained winds of 90 km/h gusting to 110 km/h. Sea state is phenomenal (>4m). Complete coastal evacuation order active.',
        recommendedActions: [
          'Immediate cessation of all maritime activities.',
          'Secure craft in inner creeks or haul up onto dry slips.',
          'All port operations suspended.'
        ]
      });
    } else if (scenario === 'HIGH_WAVE_SWELL') {
      return this.createAlert({
        title: 'INCOIS High Swell Alert: 3.8m Waves forecasted near Kochi',
        type: 'HIGH_WAVE_WARNING',
        severity: 'WARNING',
        sector: 'Kochi Harbor',
        agency: 'INCOIS Ocean State Forecast Centre',
        summary: 'Sudden swell surge expected due to distant Southern Ocean storm. Swell period 16 seconds.',
        recommendedActions: [
          'Small vessels return to harbor before 16:00 IST.',
          'Ensure life jackets donned on all operating craft.'
        ]
      });
    } else if (scenario === 'PORT_CLOSURE') {
      return this.createAlert({
        title: 'Emergency Port Barricade: Kasimedu Harbor Entry Closed',
        type: 'PORT_CLOSURE',
        severity: 'WARNING',
        sector: 'Chennai Offshore',
        agency: 'Coast Guard Regional HQ (East)',
        summary: 'Obstruction in main navigation channel due to drifting container. Port closed for all vessel transit.',
        recommendedActions: [
          'Divert to nearest secondary fishing jetty at Ennore.',
          'Maintain watch on VHF Channel 16.'
        ]
      });
    } else if (scenario === 'LIGHTNING_SQUALL') {
      return this.createAlert({
        title: 'Severe Convective Squall & Lightning Warning',
        type: 'LIGHTNING_HAZARD',
        severity: 'WATCH',
        sector: 'Visakhapatnam',
        agency: 'IMD Marine Cyclone Division',
        summary: 'Intense thunderstorm line moving east at 25 knots. Extreme electrocution hazard.',
        recommendedActions: [
          'Avoid open deck operations during lightning peak.',
          'Ensure vessel GPS and VHF are grounded.'
        ]
      });
    }

    return null;
  }
}

module.exports = AlertService;
