# 🐋 ORCA – Agentic AI Marine Intelligence Platform
> **Smart India Hackathon 2026** | Problem Statement: AI-Powered Marine Advisory & Fisherfolk Safety System

![ORCA Banner](https://img.shields.io/badge/ORCA-Marine%20Intelligence-008080?style=for-the-badge&logo=anchor)
![Build Status](https://img.shields.io/badge/Build-Passing%20(12%2F12)-brightgreen?style=for-the-badge)
![Safety Guarantee](https://img.shields.io/badge/Safety-Deterministic%20Zero--Hallucination-blue?style=for-the-badge)
![Languages](https://img.shields.io/badge/Languages-6%20Coastal%20Languages%20%2B%20TTS-orange?style=for-the-badge)

---

## 🧭 System Architecture & Paradigm

ORCA operates on a foundational marine safety principle:
$$\textbf{AI Orchestrates} \longrightarrow \textbf{Data Provides Evidence} \longrightarrow \textbf{Rules Calculate Risk} \longrightarrow \textbf{AI Explains Result}$$

```
                           [ User Query (Voice / Text in 6 Languages) ]
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │      IntentAgent      │
                                    └───────────┬───────────┘
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │     PlannerAgent      │
                                    └───────────┬───────────┘
                                                │
                 ┌──────────────┬───────────────┼──────────────┬──────────────┐
                 ▼              ▼               ▼              ▼              ▼
           ┌───────────┐  ┌───────────┐   ┌───────────┐  ┌───────────┐  ┌───────────┐
           │  Weather  │  │   Ocean   │   │    PFZ    │  │ Advisory  │  │ Geofence  │
           │  Worker   │  │  Worker   │   │  Worker   │  │  Worker   │  │  Worker   │
           └─────┬─────┘  └─────┬─────┘   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
                 │              │               │              │              │
                 └──────────────┴───────────────┼──────────────┴──────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │    AggregatorAgent    │
                                    └───────────┬───────────┘
                                                │
                                                ▼
                        ╔═══════════════════════════════════════════════╗
                        ║   DETERMINISTIC RISK ASSESSMENT ENGINE        ║
                        ║   (Zero-Hallucination WMO-522 / INCOIS Rules) ║
                        ╚═══════════════════════╤═══════════════════════╝
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │    ExplainerAgent     │
                                    │  (Citations + Audit)  │
                                    └───────────┬───────────┘
                                                │
                                                ▼
                         [ Decision Support Output + Evidence Drawer ]
```

---

## ✨ Core Innovations & Key Features

### 1. 🛡️ Deterministic Zero-Hallucination Risk Engine
- **Strict Rule Boundaries**: Evaluates wind speed (<20, 20-35, 35-50, >50 km/h), wave heights (<1.5, 1.5-2.5, 2.5-3.5, >3.5 m), visibility, and lightning.
- **Peak-Dominance Logic**: Heavy swell (>3.0 m) cannot be diluted by sunny skies.
- **Vessel Vulnerability Modifiers**: Traditional Canoes (1.35x), Small Motorized (1.20x), Mechanized Trawlers (1.00x), Deep-Sea Vessels (0.85x).
- **Critical Overrides**: Automatic instant voyage ban on IMD Cyclone Warnings or waves >3.5 m.

### 2. 🔍 Audit-Ready Explainability & Evidence Drawer
- **5-Tier Verified Citations**: Every advisory links to INCOIS, IMD, Sentinel-3 Satellite, Coastal Radar, and Naval Hydrographic notices.
- **Causal Factor Breakdown**: Clear explanation of *why* an advisory is categorized as Moderate, High, or Critical.
- **Mandatory Disclaimers**: Adheres to international maritime decision-support guidelines.

### 3. 🗺️ Multi-Layer Marine GIS & Geofencing
- **Interactive Layers**: Potential Fishing Zones (PFZs), INS Trata Naval Firing Ranges, Malvan Marine Sanctuary (MPA), Shipping Lanes, and Reef Hazards.
- **Sub-Meter Ray-Casting & Edge Projection**: Instant breach detection with perpendicular distance calculation.
- **1-Click Simulation Engine**: Test boundary breaches and emergency alerts instantly.

### 4. 🚢 Lower-Risk Route Planning
- **Dual Trajectory Generation**: Compares Direct Baseline (traversing hazard/military zones) against Lower-Risk Alternatives (skirting high-risk perimeters).
- **Navigation Analytics**: Distance (NM), Transit Time, Waypoint Coordinates, and % Risk Reduction metrics.

### 5. 🗣️ Multilingual Voice & Speech Engine
- **6 Coastal Languages**: English, Hindi (हिंदी), Marathi (मराठी), Tamil (தமிழ்), Malayalam (മലയാളം), Gujarati (ગુજરાતી).
- **Web Speech API**: Browser-native Speech-to-Text (STT) and coastal dialect Text-to-Speech (TTS).

### 6. 📊 Agent Trace Visualizer & Compliance Audit Log
- **Step-by-Step DAG Inspector**: View worker payloads, execution latency, and token metrics.
- **Compliance Export**: One-click JSON export for port authorities and Coast Guard auditing.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Leaflet, React-Leaflet, Lucide Icons, Web Speech API |
| **Backend** | Node.js (v20), Express.js, JWT, Bcrypt.js, CORS, Morgan |
| **Data Providers** | Open-Meteo Weather & Marine API, INCOIS OSF Model Fallback, WGS84 GeoJSON |
| **Containerization** | Docker, Docker Compose, Nginx Alpine |
| **Testing** | Master End-to-End Test Suite (`test_master.js`) – 12/12 Automated Integration Tests |

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Option A: Local Development Setup
```bash
# 1. Clone & Enter repository
cd orca

# 2. Install dependencies
npm run install:all

# 3. Start development servers (Backend: port 5000, Frontend: port 5173)
npm run dev
```

Open your browser at **`http://localhost:5173`**.

### Option B: Docker Compose Deployment
```bash
docker-compose up --build
```
Access the containerized application at **`http://localhost:3000`**.

---

## 🧪 Master Test Suite

Run the comprehensive 12-stage integration test suite:
```bash
cd orca/backend
node test_master.js
```

### Verification Results:
```
========================================================================
>>> ORCA – AGENTIC AI MARINE INTELLIGENCE PLATFORM (SIH 2026) <<<
>>> MASTER END-TO-END VERIFICATION & INTEGRATION TEST SUITE     <<<
========================================================================

[TEST 01] System Health & Heartbeat (/api/health)...              ✅ PASSED
[TEST 02] Operator Authentication & JWT Issuance (/api/auth)...   ✅ PASSED
[TEST 03] Live Weather & Ocean Providers (/api/weather)...        ✅ PASSED
[TEST 04] Interactive GIS GeoJSON Feature Layers (/api/map)...    ✅ PASSED
[TEST 05] Deterministic Risk Engine Boundary Rules (/api/risk)...  ✅ PASSED
[TEST 06] Multi-Agent Task Decomposition DAG (/api/agents)...     ✅ PASSED
[TEST 07] Audit-Ready Explainability & Citations (/api/explain)... ✅ PASSED
[TEST 08] Geofencing Ray-Casting & MPA Breach (/api/geofence)...  ✅ PASSED
[TEST 09] Lower-Risk Vessel Route Planning (/api/routes)...       ✅ PASSED
[TEST 10] Emergency Broadcast System (/api/alerts)...             ✅ PASSED
[TEST 11] Multilingual Understanding in Hindi & Marathi...        ✅ PASSED
[TEST 12] Compliance Audit Log JSON Export (/api/traces)...       ✅ PASSED

========================================================================
>>> SUMMARY: 12/12 TESTS PASSED (100% SUCCESS RATE) <<<
========================================================================
```

---

## 📡 REST API Catalog

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health and provider status |
| `POST` | `/api/auth/register` | Register captain and issue JWT |
| `POST` | `/api/auth/login` | Operator login |
| `GET` | `/api/weather` | Real-time weather telemetry |
| `GET` | `/api/ocean` | Real-time wave and swell telemetry |
| `GET` | `/api/map/layers` | Full GIS GeoJSON dataset |
| `POST` | `/api/risk/evaluate` | Pure deterministic risk engine |
| `POST` | `/api/agents/execute`| 10-step multi-agent orchestrator DAG |
| `POST` | `/api/chat/message` | Multilingual chat processing |
| `POST` | `/api/explain/package`| Citations and causal decision factors |
| `POST` | `/api/geofence/simulate`| Ray-casting geofence breach simulation |
| `POST` | `/api/routes/plan` | Lower-risk avoidance route generator |
| `POST` | `/api/alerts/simulate`| Emergency broadcast system |
| `GET` | `/api/traces/export` | Compliance audit trail JSON download |

---

## 📜 Scientific Compliance & Disclaimers
*ORCA is engineered strictly for maritime decision support. Calculations adhere to WMO-522, IMD, and INCOIS Ocean State Forecast guidelines. In accordance with maritime safety standards, the platform never issues absolutist assertions ("guaranteed safe") and provides deterministic, audit-traceable risk indicators.*

---
**Developed with pride for Smart India Hackathon 2026 🇮🇳**