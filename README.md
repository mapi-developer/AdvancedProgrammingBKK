# Project Documentation: Budapest Real-Time Transit & Accessibility Analytics

## How to run the project

- If you want to run analysis part you need to create Anaconda python environment and install all packages from `analysis/requirements.txt`.

    Then you can run notebook analysis scripts

- If you want to run Interactive WebApp localy you need to build up `docker-compose.yml` file from root project directory it will launch whole backend service. After that from `frontend` directory you can launch app with `npm run dev` command.

    Then you will have your web app running on `http://localhost:3000`

## 1. Project Overview
This project is a full-stack data engineering and web application designed to analyze and visualize the public transportation network of Budapest (BKK). The system serves a dual purpose:
1.  **Accessibility Analytics:** Extracting, processing, and analyzing static and dynamic transit data to calculate the wheelchair accessibility footprint across tram, bus, and metro routes.
2.  **Real-Time Monitoring:** Providing an interactive, web-based map that displays live vehicle locations, station data, and the aggregated accessibility analytics via a responsive UI.

## 2. System Architecture & Tech Stack
The architecture is designed for high-throughput data ingestion, spatial querying, and low-latency client updates.

* **Frontend / Client:** Next.js, React, Mapbox GL JS (or Leaflet) for interactive mapping.
* **Backend API & Services:** Python (FastAPI), WebSockets for real-time client communication.
* **Data Ingestion & Streaming:** Apache Kafka (for handling BKK GTFS-Realtime streams).
* **Database:** PostgreSQL with the PostGIS extension (for spatial data and station coordinates).
* **Infrastructure & Deployment:** Docker, Docker Compose (containerizing the backend, database, and message brokers).

## 3. Phase 1: Data Pipeline & Accessibility Analysis

### 3.1. Data Sources
* **BKK GTFS (Static):** Used to map out routes, trips, stops, and base station metadata. Contains the core accessibility flags (e.g., `wheelchair_boarding` in `stops.txt` and `wheelchair_accessible` in `trips.txt`).
* **BKK GTFS-Realtime (Dynamic):** Consumed to track live vehicle positions, trip updates, and service alerts.

### 3.2. ETL & Processing Workflow
1.  **Extraction:** Scheduled cron jobs/Python workers pull the latest static GTFS zip files from the BKK Open Data portal.
2.  **Transformation:** * Parse relational CSVs (stops, routes, trips).
    * Join `trips` with `routes` to categorize transit types (tram, bus, metro).
    * Normalize spatial coordinates into PostGIS geometry types.
3.  **Loading:** Upsert processed data into the PostgreSQL database.

### 3.3. Accessibility Metrics Calculation
The analysis engine calculates the following key performance indicators (KPIs):
* **Global Network Share:** Percentage of total active stops equipped for wheelchair boarding.
* **Route-Specific Accessibility:** Ratio of accessible trips to total trips per route (highlighting routes with partial low-floor vehicle deployment).
* **Modal Breakdown:** Comparative accessibility scores between the Metro network (mostly accessible via elevators), Trams (mixed, reliant on low-floor CAF/Combino units), and Buses.
* **Spatial Coverage:** Geographic density of accessible stops, identifying "transit deserts" for users with reduced mobility.

## 4. Phase 2: Interactive Web Application

### 4.1. Next.js Frontend
* **Interactive Map Component:** Renders the map of Budapest. Includes toggleable layers for Routes, Stops, and Live Vehicles.
* **Accessibility Dashboard:** A side-panel or modal system displaying the analytical KPIs (charts and percentage metrics) generated in Phase 1.
* **Visual Coding:** Stations and routes are color-coded based on their accessibility status (e.g., Green for fully accessible, Yellow for partial, Red for non-accessible).

### 4.2. Real-Time WebSockets Implementation
To ensure the map reflects current transit conditions without overwhelming the BKK API or the client:
1.  **Ingestion:** A backend Python worker continuously polls the BKK GTFS-Realtime endpoint and pushes updates to a Kafka topic.
2.  **Processing:** A consumer service filters the raw protobuf data, extracting only necessary fields (Vehicle ID, Lat/Lon, Route ID, Delay).
3.  **Broadcasting:** The FastAPI backend maintains active WebSocket connections with the Next.js clients. It broadcasts lightweight JSON payloads containing state changes (deltas) rather than the entire vehicle array, minimizing bandwidth.

## 5. API Endpoints (Internal)

### REST (Static Data)
* `GET /api/v1/stats/accessibility`: Returns JSON payload of network-wide accessibility percentages.
* `GET /api/v1/routes/{route_id}`: Returns GeoJSON line-strings for map rendering and specific route accessibility data.
* `GET /api/v1/stops`: Returns GeoJSON points for all stations with `wheelchair_boarding` status.

### WebSocket (Dynamic Data)
* `ws://{host}/ws/vehicles`: Subscribes the client to the live vehicle location stream.

## 6. Containerization Strategy (Docker)
The application environment is strictly isolated using Docker Compose, ensuring parity between development and production.

* `db-service`: PostgreSQL + PostGIS image.
* `kafka-broker` & `zookeeper`: For managing the real-time message stream.
* `ingestion-worker`: Python container dedicated to fetching and parsing BKK data.
* `api-service`: Python FastAPI container serving REST endpoints and managing WebSocket connections.
* `web-frontend`: Next.js node container serving the application UI.

## 7. Future Improvements
* **Historical Analysis:** Storing real-time delay data to analyze punctuality correlations with accessibility (e.g., do low-floor deployments impact dwell times?).
* **Routing Engine:** Implementing pgRouting to allow users to generate custom A-to-B navigation paths that strictly utilize wheelchair-accessible nodes.
* **Alert Integration:** Incorporating BKK service alerts to notify users if an elevator at a metro station goes out of service dynamically.