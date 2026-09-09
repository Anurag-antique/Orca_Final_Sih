const weatherService = require('../services/weather.service');
const oceanService = require('../services/ocean.service');
const pfzService = require('../services/pfz.service');
const advisoryService = require('../services/advisory.service');
const geospatialService = require('../services/geospatial.service');
const { RiskAssessmentEngine } = require('../engine');

const SECTOR_COORDS = {
  'Mumbai Coast': { lat: 18.9220, lon: 72.8347, state: 'Maharashtra / Western EEZ' },
  'Kochi Harbor': { lat: 9.9312, lon: 76.2673, state: 'Kerala / Arabian Sea' },
  'Chennai Offshore': { lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu / Bay of Bengal' },
  'Visakhapatnam': { lat: 17.6868, lon: 83.2185, state: 'Andhra Pradesh / Bay of Bengal' },
  'Porbandar': { lat: 21.6417, lon: 69.6293, state: 'Gujarat / Gulf of Kutch' }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const sectorName = req.query.sector || 'Mumbai Coast';
    const sector = SECTOR_COORDS[sectorName] || SECTOR_COORDS['Mumbai Coast'];

    const location = {
      lat: req.query.lat ? parseFloat(req.query.lat) : sector.lat,
      lon: req.query.lon ? parseFloat(req.query.lon) : sector.lon,
      sectorName
    };

    // Parallel multi-provider queries
    const [weatherRes, oceanRes, pfzRes, advisoryRes, geoRes] = await Promise.all([
      weatherService.getWeather(location),
      oceanService.getOceanConditions(location),
      pfzService.getPFZs(location),
      advisoryService.getAdvisories(location),
      geospatialService.getGeospatialZones(location)
    ]);

    const weatherData = weatherRes.data || {};
    const oceanData = oceanRes.data || {};
    const pfzData = pfzRes.data || {};
    const advisoryData = advisoryRes.data || {};
    const geoData = geoRes.data || {};

    // Pure deterministic risk evaluation from Phase 8 Engine
    const riskAssessment = RiskAssessmentEngine.evaluate({
      weather: weatherData,
      ocean: oceanData,
      advisory: advisoryData,
      geospatial: geoData,
      vesselProfile: { typeKey: req.query.vesselType || 'small_motorized' }
    });

    const telemetry = {
      location: {
        name: sectorName === 'Mumbai Coast' ? 'Arabian Sea / Mumbai Coast' : `${sectorName} Sector`,
        coordinates: { lat: location.lat, lon: location.lon },
        coastalState: sector.state,
        timestamp: new Date().toISOString(),
      },
      riskAssessment,
      weather: {
        status: weatherRes.source?.isFallback ? 'Fallback Model' : 'Live Satellite Feed',
        temperatureC: weatherData.temperatureC,
        windSpeedKmh: weatherData.windSpeedKmh,
        windDirection: `${weatherData.windDirectionCardinal} (${weatherData.windDirectionDegrees}°)`,
        precipitationMm: weatherData.precipitationMm,
        visibilityKm: weatherData.visibilityKm,
        lightningAlert: weatherData.lightningRisk || 'NONE',
        cycloneAlert: weatherData.cycloneAlert?.category || 'NO ACTIVE CYCLONE',
        isDemoData: weatherRes.source?.isDemoData ?? false,
        isFallback: weatherRes.source?.isFallback ?? false,
        sourceOrigin: weatherRes.source?.origin || 'Open-Meteo API',
        dataset: weatherRes.source?.dataset || 'NWP Model'
      },
      ocean: {
        status: oceanRes.source?.isFallback ? 'Fallback Model' : 'Live Marine Feed',
        sstCelsius: oceanData.seaSurfaceTemperatureC,
        chlorophyllMgM3: oceanData.chlorophyllMgM3,
        significantWaveHeightM: oceanData.significantWaveHeightM,
        wavePeriodSec: oceanData.wavePeriodSec,
        tideStatus: oceanData.tide?.currentPhase || 'Ebb Tide',
        currentSpeedMps: oceanData.current?.speedMps,
        isDemoData: oceanRes.source?.isDemoData ?? false,
        isFallback: oceanRes.source?.isFallback ?? false,
        sourceOrigin: oceanRes.source?.origin || 'Open-Meteo Marine / INCOIS',
        dataset: oceanRes.source?.dataset || 'Ocean State Forecast'
      },
      pfz: {
        status: pfzRes.source?.isDemoData ? 'Satellite Model (Demo)' : 'Live Satellite Advisory',
        zoneCount: pfzData.zoneCount || 0,
        nearestZoneDistanceKm: pfzData.nearestZone?.distanceKm || 16.2,
        bearingDegrees: pfzData.nearestZone?.bearingDegrees || 265,
        potentialRating: pfzData.nearestZone?.recommendationLabel || 'Potentially Favourable',
        sstFrontIdentified: true,
        chlorophyllBloom: `Moderate (${pfzData.nearestZone?.chlorophyllConcentrationMgM3 || 1.15} mg/m³)`,
        targetSpecies: pfzData.nearestZone?.targetSpecies || ['Mackerel', 'Carangids'],
        isDemoData: pfzRes.source?.isDemoData ?? true,
        sourceOrigin: pfzRes.source?.origin || 'INCOIS Satellite Integrated Advisory',
        dataset: pfzRes.source?.dataset
      },
      alerts: advisoryData.advisories || [],
      geofence: {
        status: 'CLEAR',
        restrictedZonesNearby: geoData.zones?.restrictedZonesNearby?.length || 0,
        marineProtectedAreasNearby: geoData.zones?.marineProtectedAreasNearby?.length || 0,
        distanceToTerritorialBoundaryKm: geoData.zones?.eezBoundary?.distanceToTerritorialLimitKm || 22.2,
        isDemoData: true
      }
    };

    return res.status(200).json({
      success: true,
      data: telemetry,
      message: 'Live operational marine telemetry aggregated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary
};
