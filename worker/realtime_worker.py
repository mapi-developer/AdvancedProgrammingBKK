import os
import time
import json
import requests
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
from google.transit import gtfs_realtime_pb2

# Configuration
API_KEY = os.getenv("BKK_API_KEY")
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
TOPIC = "bkk_vehicle_positions"

# BKK Vehicle Positions Endpoint (Protocol Buffers)
BKK_URL = f"https://go.bkk.hu/api/query/v1/ws/gtfs-rt/full/VehiclePositions.pb?key={API_KEY}"

def get_kafka_producer(retries=10, delay=5):
    """Wait for Kafka to be ready before connecting."""
    for i in range(retries):
        try:
            producer = KafkaProducer(
                bootstrap_servers=[KAFKA_BROKER],
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            print("Successfully connected to Kafka!")
            return producer
        except NoBrokersAvailable:
            print(f"Kafka not ready. Retrying in {delay} seconds... ({i+1}/{retries})")
            time.sleep(delay)
    raise Exception("Could not connect to Kafka.")

def stream_vehicle_positions(producer):
    print(f"Starting real-time stream from BKK. Publishing to topic: {TOPIC}")
    
    # Initialize the GTFS-Realtime FeedMessage parser
    feed = gtfs_realtime_pb2.FeedMessage()
    
    while True:
        try:
            response = requests.get(BKK_URL)
            response.raise_for_status()
            
            # Parse the binary protobuf response
            feed.ParseFromString(response.content)
            
            extracted_vehicles = 0
            for entity in feed.entity:
                if entity.HasField('vehicle'):
                    vehicle = entity.vehicle
                    
                    # Extract only the necessary fields as per your architecture
                    payload = {
                        "vehicle_id": vehicle.vehicle.id,
                        "route_id": vehicle.trip.route_id,
                        "lat": vehicle.position.latitude,
                        "lon": vehicle.position.longitude,
                        # Set delay to 0 for now. (Real delays require the TripUpdates.pb stream)
                        "delay": 0, 
                        "timestamp": vehicle.timestamp
                    }
                    
                    # Push to Kafka
                    producer.send(TOPIC, value=payload)
                    extracted_vehicles += 1
            
            # Force send all buffered messages
            producer.flush()
            print(f"[{time.strftime('%X')}] Pushed {extracted_vehicles} vehicle updates to Kafka.")
            
        except Exception as e:
            print(f"Error fetching or parsing data: {e}")

        # BKK updates data every 10+ seconds. 
        # A 10-second sleep respects their rate limit recommendations.
        time.sleep(60)

if __name__ == "__main__":
    if not API_KEY:
        raise ValueError("BKK_API_KEY environment variable is missing!")
    
    producer = get_kafka_producer()
    stream_vehicle_positions(producer)