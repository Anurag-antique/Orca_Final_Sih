const { RiskAssessmentEngine, thresholds } = require('./src/engine');
const app = require('./src/app');
const http = require('http');

console.log('====================================================');
console.log('>>> RUNNING PHASE 8 DETERMINISTIC RISK ENGINE TESTS <<<');
console.log('====================================================\n');

// 1. Test Low Risk Conditions
console.log('1. Testing Low Risk Boundary (Wind 15 km/h, Wave 1.1m)...');
const lowEval = RiskAssessmentEngine.evaluate({
  weather: { windSpeedKmh: 15, visibilityKm: 10 },
  ocean: { significantWaveHeightM: 1.1, wavePeriodSec: 8.0 }
});
console.log(`   Result: Score ${lowEval.riskScore}/100, Level: ${lowEval.riskLevel}`);
if (lowEval.riskLevel !== 'LOW' || lowEval.riskScore >= 35) {
  throw new Error(`Low risk evaluation failed: expected LOW, got ${lowEval.riskLevel}`);
}

// 2. Test Moderate Risk Conditions
console.log('2. Testing Moderate Risk Boundary (Wind 28 km/h, Wave 2.1m)...');
const modEval = RiskAssessmentEngine.evaluate({
  weather: { windSpeedKmh: 28, visibilityKm: 8 },
  ocean: { significantWaveHeightM: 2.1, wavePeriodSec: 6.5 }
});
console.log(`   Result: Score ${modEval.riskScore}/100, Level: ${modEval.riskLevel}`);
if (modEval.riskLevel !== 'MODERATE' || modEval.riskScore < 35 || modEval.riskScore >= 65) {
  throw new Error(`Moderate risk evaluation failed: expected MODERATE, got ${modEval.riskLevel} (${modEval.riskScore})`);
}

// 3. Test High Risk Conditions
console.log('3. Testing High Risk Boundary (Wind 44 km/h, Wave 3.0m)...');
const highEval = RiskAssessmentEngine.evaluate({
  weather: { windSpeedKmh: 44, visibilityKm: 5 },
  ocean: { significantWaveHeightM: 3.0, wavePeriodSec: 5.5 }
});
console.log(`   Result: Score ${highEval.riskScore}/100, Level: ${highEval.riskLevel}`);
if (highEval.riskLevel !== 'HIGH' || highEval.riskScore < 65 || highEval.riskScore >= 85) {
  throw new Error(`High risk evaluation failed: expected HIGH, got ${highEval.riskLevel} (${highEval.riskScore})`);
}

// 4. Test Critical Override (Phenomenal Wave > 3.5m)
console.log('4. Testing Critical Wave Override (Wave 4.2m)...');
const waveCritEval = RiskAssessmentEngine.evaluate({
  weather: { windSpeedKmh: 15 },
  ocean: { significantWaveHeightM: 4.2 }
});
console.log(`   Result: Score ${waveCritEval.riskScore}/100, Level: ${waveCritEval.riskLevel}, Override: ${waveCritEval.isOverride}`);
if (waveCritEval.riskLevel !== 'CRITICAL' || !waveCritEval.isOverride) {
  throw new Error('Critical wave override failed');
}

// 5. Test Critical Override (Cyclone Warning)
console.log('5. Testing Critical Cyclone Warning Override...');
const cycEval = RiskAssessmentEngine.evaluate({
  weather: { windSpeedKmh: 22, cycloneAlert: { active: true, category: 'VERY_SEVERE_CYCLONIC_STORM' } },
  ocean: { significantWaveHeightM: 1.8 }
});
console.log(`   Result: Score ${cycEval.riskScore}/100, Level: ${cycEval.riskLevel}, Override: ${cycEval.isOverride}`);
if (cycEval.riskLevel !== 'CRITICAL' || cycEval.riskScore < 95) {
  throw new Error('Critical cyclone override failed');
}

// 6. Test Vessel Vulnerability Multiplier
console.log('6. Testing Vessel Vulnerability Multipliers...');
const smallVesselEval = RiskAssessmentEngine.evaluate({
  weather: { windSpeedKmh: 25 },
  ocean: { significantWaveHeightM: 1.8 },
  vesselProfile: { typeKey: 'traditional_unmotorized' }
});
const largeVesselEval = RiskAssessmentEngine.evaluate({
  weather: { windSpeedKmh: 25 },
  ocean: { significantWaveHeightM: 1.8 },
  vesselProfile: { typeKey: 'deep_sea_vessel' }
});
console.log(`   Traditional Craft Score: ${smallVesselEval.riskScore} vs Deep Sea Vessel: ${largeVesselEval.riskScore}`);
if (smallVesselEval.riskScore <= largeVesselEval.riskScore) {
  throw new Error('Vessel risk adjustment failed');
}

// 7. Test HTTP API Endpoints
const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    console.log('7. Testing POST /api/risk/evaluate endpoint...');
    const res = await fetch(`${baseUrl}/risk/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weather: { windSpeedKmh: 30 },
        ocean: { significantWaveHeightM: 2.2 },
        vesselProfile: { typeKey: 'small_motorized' }
      })
    });
    const data = await res.json();
    console.log('   API Status:', res.status, 'Risk Level:', data.data?.riskLevel, 'Triggered Rules:', data.data?.triggeredRules?.length);
    if (res.status !== 200 || data.data?.triggeredRules?.length !== 6) {
      throw new Error('Risk evaluate API failed');
    }

    console.log('\n========================================');
    console.log('>>> ALL PHASE 8 RISK ENGINE TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 8 HTTP test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
