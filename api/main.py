import os
import json
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from aiokafka import AIOKafkaConsumer

# Configuration
DB_URL = os.getenv("POSTGRES_URL", "postgresql://user:password@postgres:5432/bkk_transit")
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka:9092")
TOPIC = "bkk_vehicle_positions"

# Initialize FastAPI and Database Engine
app = FastAPI(title="BKK Transit & Accessibility API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Explicitly allow your Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)
engine = create_engine(DB_URL)

# ---------------------------------------------------------
# REST ENDPOINT: Static Spatial Data (Phase 1)
# ---------------------------------------------------------
@app.get("/api/v1/stops")
def get_stops():
    """
    Fetches all transit stops and returns them as a GeoJSON FeatureCollection.
    This is optimized for direct ingestion by Mapbox/Leaflet frontends.
    """
    try:
        with engine.connect() as conn:
            # ST_AsGeoJSON is a PostGIS function that translates binary geometry to JSON
            query = text("""
                SELECT 
                    stop_id, 
                    stop_name, 
                    wheelchair_boarding, 
                    ST_AsGeoJSON(geometry) as geom 
                FROM stops
                WHERE geometry IS NOT NULL;
            """)
            result = conn.execute(query)
            
            features = []
            for row in result:
                # Construct a standard GeoJSON Feature
                feature = {
                    "type": "Feature",
                    "geometry": json.loads(row.geom),
                    "properties": {
                        "stop_id": row.stop_id,
                        "stop_name": row.stop_name,
                        "wheelchair_boarding": row.wheelchair_boarding
                    }
                }
                features.append(feature)
                
            return {
                "type": "FeatureCollection",
                "features": features
            }
            
    except OperationalError:
        raise HTTPException(status_code=500, detail="Database connection failed.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# WEBSOCKET ENDPOINT: Real-Time Kafka Stream (Phase 2)
# ---------------------------------------------------------
@app.websocket("/ws/vehicles")
async def websocket_vehicles(websocket: WebSocket):
    """
    Subscribes the client to the live vehicle location stream.
    Consumes messages from Kafka and broadcasts them via WebSockets.
    """
    await websocket.accept()
    
    # Initialize async Kafka consumer
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=KAFKA_BROKER,
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        auto_offset_reset='latest' # Only fetch new locations, ignore old history
    )
    
    await consumer.start()
    print("WebSocket client connected to Kafka stream.")
    
    try:
        async for msg in consumer:
            # Broadcast the lightweight JSON payload directly to the frontend
            await websocket.send_json(msg.value)
            
    except WebSocketDisconnect:
        print("WebSocket client disconnected.")
    finally:
        # Ensure clean shutdown of the consumer to free up resources
        await consumer.stop()