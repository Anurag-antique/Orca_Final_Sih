const BaseProvider = require('../base/BaseProvider');
const IAdvisoryProvider = require('./IAdvisoryProvider');

class MockAdvisoryProvider extends BaseProvider {
  constructor() {
    super('Mock-INCOIS-IMD-MarineAdvisoryProvider', 'MARINE_ADVISORY', '1.0.0', true);
  }

  async getAdvisories(location) {
    try {
      const lat = parseFloat(location?.lat) || 18.9220;
      const lon = parseFloat(location?.lon) || 72.8347;

      const advisories = [
        {
          id: 'adv_incois_01',
          agency: 'INCOIS Ocean State Forecast',
          type: 'HIGH_WAVE_WATCH',
          severity: 'ADVISORY',
          title: 'High Wave Watch for Maharashtra Coast',
          issuedAt: new Date(Date.now() - 7200000).toISOString(),
          effectiveUntil: new Date(Date.now() + 86400000).toISOString(),
          description: 'High waves in the range of 1.8 - 2.2 meters are forecast along the coast from Dahanu to Murud Janjira. Surface currents may reach 0.5 - 0.9 m/s during peak tidal change.',
          actionRecommended: 'Small craft and non-mechanized traditional vessels advised to exercise caution when operating beyond 15 nautical miles offshore.',
          isDemoData: true
        },
        {
          id: 'adv_imd_02',
          agency: 'IMD Coastal Weather Bulletin',
          type: 'SQUALLY_WIND_NOTICE',
          severity: 'INFORMATIONAL',
          title: 'Moderate Gusts along West Coast',
          issuedAt: new Date(Date.now() - 14400000).toISOString(),
          effectiveUntil: new Date(Date.now() + 43200000).toISOString(),
          description: 'Squally weather with wind speed occasionally reaching 40-45 kmph likely along and off Konkan-Goa coast.',
          actionRecommended: 'Fishermen are advised to monitor radio frequency VHF Channel 16 for live updates.',
          isDemoData: true
        }
      ];

      return this.standardizeResponse({
        queryLocation: { lat, lon },
        advisoriesCount: advisories.length,
        highestSeverity: 'ADVISORY',
        advisories
      }, {
        dataset: 'INCOIS Marine Safety & IMD Cyclone Warning Division Bulletins',
        origin: 'Ministry of Earth Sciences (MoES) Multi-Agency Feeds',
        updateFrequency: 'Every 6 Hours'
      });
    } catch (err) {
      return this.handleError(err, 'getAdvisories');
    }
  }
}

module.exports = MockAdvisoryProvider;
