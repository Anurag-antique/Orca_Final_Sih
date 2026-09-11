const weatherService = require('../services/weather.service');
const oceanService = require('../services/ocean.service');
const pfzService = require('../services/pfz.service');
const advisoryService = require('../services/advisory.service');
const geospatialService = require('../services/geospatial.service');
const sourceService = require('../services/source.service');
const marineContextService = require('../services/marineContext.service');

const parseLocation = (req) => {
  return {
    lat: req.query.lat ? parseFloat(req.query.lat) : 18.922,
    lon: req.query.lon ? parseFloat(req.query.lon) : 72.8347,
    sectorName: req.query.sector || "Mumbai Coast",
  };
};

const getWeather = async (req, res, next) => {
  try {
    const location = parseLocation(req);
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const result = await weatherService.getWeather(location, date);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getOceanConditions = async (req, res, next) => {
  try {
    const location = parseLocation(req);
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const result = await oceanService.getOceanConditions(location, date);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPFZs = async (req, res, next) => {
  try {
    const location = parseLocation(req);
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const result = await pfzService.getPFZs(location, date);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getAdvisories = async (req, res, next) => {
  try {
    const location = parseLocation(req);
    const result = await advisoryService.getAdvisories(location);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getGeospatialZones = async (req, res, next) => {
  try {
    const location = parseLocation(req);
    const result = await geospatialService.getGeospatialZones(location);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getDataSources = (req, res, next) => {
  try {
    const result = sourceService.getDataSources();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getMarineContext = async (req, res, next) => {
  try {
    const location = parseLocation(req);
    return res.status(200).json(await marineContextService.getContext(location));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeather,
  getOceanConditions,
  getPFZs,
  getAdvisories,
  getGeospatialZones,
  getDataSources,
  getMarineContext
};
