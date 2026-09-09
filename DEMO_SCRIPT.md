# 🌊 ORCA – Live Hackathon Evaluation & Demo Script (5 Minutes)
**Smart India Hackathon 2026 | Marine Intelligence & Fisherfolk Safety**

---

## 🎯 Executive Pitch (30 Seconds)
> *"Respected Judges, India has a 7,500 km coastline and over 4 million active fishermen facing unpredictable oceanic hazards, border zone intrusions, and cyclone threats. While LLMs are revolutionary, giving raw generative AI control over safety-critical advisory leads to dangerous hallucinations.*
>
> *Introducing **ORCA** – the world's first **Agentic Marine Intelligence Platform with Deterministic Safety Guarantees**. ORCA uses AI to understand complex multilingual queries and orchestrate data gathering, but delegates 100% of safety risk calculations to an INCOIS & WMO-522 compliant deterministic rule engine. The AI then synthesizes and explains the results with verified data citations and actionable safety directives."*

---

## ⏱️ 5-Minute Live Judging Presentation Schedule

```
+-----------------------------------------------------------------------------------+
| 00:00 - 00:30  |  Problem Statement, Vision & Zero-Hallucination Architecture     |
| 00:30 - 01:30  |  Multilingual AI Chat with Live Weather/Ocean Telemetry & Audio |
| 01:30 - 02:30  |  Evidence Drawer: Verified Citations & Causal Decision Factor    |
| 02:30 - 03:30  |  Interactive GIS Marine Map & Geofence Breach Simulation         |
| 03:30 - 04:15  |  Lower-Risk Route Planning (Naval Avoidance & Swell Bypass)      |
| 04:15 - 05:00  |  Agent Trace DAG Visualizer & Regulatory Audit Log Export        |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Step-by-Step Live Demo Execution

### **Segment 1: Operator Login & Telemetry Dashboard (0:00 - 0:30)**
1. **Screen**: Open browser at `http://localhost:5173`.
2. **Action**: Log in with demo credentials or register a new captain:
   - **Email**: `captain.vikram@orca.marine.gov.in`
   - **Password**: `MaritimeDemo2026!`
   - **Vessel**: *Matsya Sagar VII* (Artisanal Small Motorized Craft)
3. **Presenter Talking Points**:
   - Highlight the real-time sector telemetry bar: Wind Speed (20 km/h), Wave Height (1.6 m), Sea Surface Temperature (27.6°C), Barometric Pressure (1011.2 hPa).
   - Emphasize dual data providers: Real Open-Meteo API with automatic high-fidelity INCOIS/NWP simulation fallbacks.

---

### **Segment 2: Multilingual Conversational Intelligence (0:30 - 01:30)**
1. **Screen**: Navigate to **Chat Interface** (`/chat`).
2. **Action**: Select **Hindi (हिंदी)** or **Marathi (मराठी)** from the Header Language Switcher.
3. **Live Query Example (Type or click Web Speech Mic STT)**:
   > *"क्या कल सुबह मुंबई के पास मछली पकड़ने जाना सुरक्षित है?"*
   *(Or in Marathi: "उद्या सकाळी मुंबईजवळ मासेमारीसाठी जाणे सुरक्षित आहे का?")*
4. **Action**: Click **Send** or use Speech Recognition.
5. **Observe & Explain**:
   - Instant response delivered in native Hindi/Marathi script.
   - Click the **TTS Audio Button (🔊)** to hear the synthesized spoken marine advisory in coastal dialect.
   - Notice the system outputs scientific terminology: *"वर्तमान जोखीम मूल्यांकन (Current Risk Assessment): मध्यम (MODERATE)"*, *"संभाव्य अनुकूल मत्स्यपालन क्षेत्र (PFZ)"*.
   - Never uses dangerous absolutist terms like "Guaranteed Safe".

---

### **Segment 3: Evidence & Explainability Drawer (01:30 - 02:30)**
1. **Screen**: Chat result banner.
2. **Action**: Click the **"Why this recommendation?" / "View Evidence & Citations"** button.
3. **Observe & Explain**:
   - **5 Verified Data Citations**: INCOIS Wave Model, IMD High-Seas Forecast, Sentinel-3 Ocean Colour, Coastal Radar, INS Trata Hydrographic Notice.
   - **Confidence Score**: 94% verified data integrity.
   - **Causal Decomposition**:
     - Significant wave height (1.6 m) is in moderate threshold (1.5 - 2.5 m).
     - Wind gust (22 km/h) within manageable threshold.
     - Vessel vulnerability modifier (1.20x applied for small motorized craft).
   - **Mandatory Disclaimers**: Clarifies system as a decision support aid.

---

### **Segment 4: Marine GIS Map & Geofence Breach Simulation (02:30 - 03:30)**
1. **Screen**: Navigate to **Marine Map** (`/map`).
2. **Observe**: Multi-layer GIS layers displaying:
   - 🟢 Potential Fishing Zones (PFZs) with chlorophyll-a contours.
   - 🔴 INS Trata Naval Firing Restriction Perimeter.
   - 🟡 Malvan Coral Reef Marine Protected Area (MPA).
   - ⚠️ Prongs Reef Submerged Pinnacle Navigation Hazard.
3. **Action**: Click the **"⚡ Trigger Malvan MPA Breach Simulation"** button.
4. **Observe & Explain**:
   - Simulated vessel coordinates (18.7450° N, 72.6950° E) trigger instant Ray-Casting & Edge-Projection point-in-polygon detection.
   - High-severity audio-visual alert fires: **CRITICAL MPA BREACH DETECTED**.
   - Immediate advisory: *"Trawling prohibited under Wildlife Protection Act. Steer heading 295° to exit buffer."*

---

### **Segment 5: Lower-Risk Route Planning (03:30 - 04:15)**
1. **Screen**: Navigate to **Route Planning** (`/routes`).
2. **Action**: Select Origin (*Sassoon Docks Marine Terminal*) and Destination (*Mumbai PFZ Sector Alpha*). Click **"Calculate Optimized Safe Route"**.
3. **Observe & Explain**:
   - **Red Dotted Line (Direct Baseline)**: 16.4 NM, traverses directly through INS Trata naval exercise zone (Risk Score: **78 / HIGH**).
   - **Solid Emerald Line (Lower-Risk Alternative)**: 18.2 NM, skirts 2.1 NM clear of naval zone perimeter and bypasses shallow reef (Risk Score: **24 / LOW**).
   - Shows trade-off analytics: +1.8 NM (+12 mins transit) for a **69% risk reduction**.

---

### **Segment 6: Agent Trace Visualizer & Regulatory Audit Log (04:15 - 05:00)**
1. **Screen**: Navigate to **Admin & Audit Trace** (`/history`).
2. **Observe & Explain**:
   - Complete 10-step Multi-Agent DAG execution tree:
     1. `IntentAgent` (Classifies intent -> SAFETY_CHECK)
     2. `PlannerAgent` (Decomposes query into 5 sub-tasks)
     3. Parallel Workers: `WeatherWorker`, `OceanWorker`, `PFZWorker`, `AdvisoryWorker`, `GeofenceWorker`
     4. `AggregatorAgent` (Merges telemetry)
     5. `DeterministicRiskEngine` (Applies WMO/INCOIS rules)
     6. `ExplainerAgent` (Generates verified narrative)
   - Real-time execution metrics: Mean DAG turnaround time < 180 ms.
3. **Action**: Click **"📥 Export Audit Trail (JSON)"** to download the immutable compliance log for port authority and maritime safety inspectors.

---

## 🏆 Key Differentiators to Highlight for Judges

| Feature | Generic LLM Chatbots | **ORCA Marine Intelligence** |
| :--- | :--- | :--- |
| **Safety Calculation** | Hallucinates risk scores from text prompts | **100% Deterministic Rule Engine (WMO/INCOIS standards)** |
| **Data Citations** | Synthesizes fake or unverified links | **5-Tier Verified Citations with telemetry timestamps** |
| **Geofencing** | Cannot calculate spatial boundaries | **Sub-meter Ray-Casting & Edge-Projection GIS Engine** |
| **Navigation** | Basic text directions | **A* Avoidance Trajectory Generator with Dual Polyline GIS** |
| **Multilingual** | English-centric translation artifacts | **6 Coastal Languages + Dialect STT & TTS Audio** |
| **Compliance** | Black-box output | **Full Multi-Agent DAG Audit Log Exportable as JSON** |

---

## ❓ Rapid Jury Q&A Cheat Sheet

- **Q: What if the internet disconnects offshore?**
  - **A**: ORCA caches sector tiles and fallback NWP/INCOIS simulation profiles on the client service worker. The deterministic risk rules execute client-side and server-side with identical output.
- **Q: How do you prevent fishermen from catching protected species?**
  - **A**: The PFZ worker cross-references chlorophyll fronts with Marine Protected Areas. If a PFZ overlaps an MPA (e.g. Malvan or Olive Ridley nesting beds), it is automatically flagged and suppressed.
- **Q: Can this be integrated into Indian Coast Guard or state fisheries networks?**
  - **A**: Yes. ORCA conforms to standard GeoJSON, REST APIs, and WGS84 coordinates, making it instantly deployable into INCOIS OSF, SAGARMANTHANA, and Port Community Systems.