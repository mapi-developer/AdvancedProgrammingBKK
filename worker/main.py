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

if __name__ == "__main__":
    time.sleep(5) 
    ingest_stops()
    ingest_routes()