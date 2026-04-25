import os
import time
import zipfile
import pandas as pd
import geopandas as gpd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

# 1. Configuration
# Grabs the URL from docker-compose.yml, defaults to localhost if running outside docker
DB_URL = os.getenv("POSTGRES_URL", "postgresql://user:password@localhost:5432/bkk_transit")
ZIP_PATH = "data/budapest_gtfs.zip"
INTERNAL_FILE = "stops.txt"

def get_db_engine(url, retries=15, delay=5):
    """Wait for the database to be fully ready before connecting."""
    engine = create_engine(url)
    for i in range(retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.commit()
            print("Successfully connected to the database!")
            return engine
        except OperationalError:
            print(f"Database not ready. Retrying in {delay} seconds... ({i+1}/{retries})")
            time.sleep(delay)
    raise Exception("Could not connect to the database after multiple retries.")

def ingest_stops():
    print(f"Reading {INTERNAL_FILE} from {ZIP_PATH}...")
    
    # 1. Bypass fsspec and use Python's rock-solid built-in zipfile library
    with zipfile.ZipFile(ZIP_PATH, 'r') as z:
        with z.open(INTERNAL_FILE) as f:
            # 2. Pass the open file stream directly into pandas
            df_stops = pd.read_csv(
                f,
                sep=",",
                usecols=["stop_id", "stop_name", "stop_lat", "stop_lon", "wheelchair_boarding"]
            )
    
    print(f"Extracted {len(df_stops)} stops. Converting to spatial data...")

    # Convert to GeoDataFrame (EPSG:4326 is standard GPS coordinates)
    gdf_stops = gpd.GeoDataFrame(
        df_stops,
        geometry=gpd.points_from_xy(df_stops.stop_lon, df_stops.stop_lat),
        crs="EPSG:4326"
    )
    
    # Drop raw lat/lon as they are now encapsulated in the 'geometry' column
    gdf_stops = gdf_stops.drop(columns=['stop_lat', 'stop_lon'])

    # Connect to DB and push data
    engine = get_db_engine(DB_URL)
    
    print("Pushing data to PostGIS...")
    # to_postgis handles creating the spatial table and necessary geometry columns
    gdf_stops.to_postgis(
        'stops', 
        engine, 
        if_exists='replace', 
        index=False
    )
    
    print("Ingestion complete! The static GTFS stops data is now in your database.")

def ingest_routes():
    print(f"Reading routes.txt from {ZIP_PATH}...")
    
    import zipfile
    with zipfile.ZipFile(ZIP_PATH, 'r') as z:
        with z.open('routes.txt') as f:
            df_routes = pd.read_csv(
                f,
                sep=",",
                # route_type: 0=Tram, 1=Metro, 3=Bus, 11=Trolleybus
                usecols=["route_id", "route_short_name", "route_type"] 
            )
            
    engine = get_db_engine(DB_URL)
    print("Pushing route metadata to PostGIS...")
    df_routes.to_sql('routes', engine, if_exists='replace', index=False)
    print("Route ingestion complete!")

def ingest_route_stops():
    print("Reading trips and stop_times to map routes to specific stops...")
    import zipfile
    
    with zipfile.ZipFile(ZIP_PATH, 'r') as z:
        # Load trips (links route_id -> trip_id)
        with z.open('trips.txt') as f:
            df_trips = pd.read_csv(f, usecols=["route_id", "trip_id"])
            
        # Load stop_times (links trip_id -> stop_id)
        with z.open('stop_times.txt') as f:
            df_stop_times = pd.read_csv(f, usecols=["trip_id", "stop_id"])

    print("Merging data to find unique route-stop pairs (This may take a moment)...")
    # Merge on trip_id, then drop duplicates to get unique route_id <-> stop_id pairs
    df_route_stops = df_trips.merge(df_stop_times, on="trip_id")[["route_id", "stop_id"]].drop_duplicates()

    engine = get_db_engine(DB_URL)
    print("Pushing route_stops mapping to PostgreSQL...")
    df_route_stops.to_sql('route_stops', engine, if_exists='replace', index=False)
    
    # Create an index to make our API queries blazingly fast
    with engine.connect() as conn:
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_route_stops_stop_id ON route_stops(stop_id);"))
        conn.commit()
        
    print("Route-Stop mapping complete!")

if __name__ == "__main__":
    time.sleep(5) 
    ingest_stops()
    ingest_routes()
    ingest_route_stops()