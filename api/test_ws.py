import asyncio
import websockets
import json

async def listen_to_bkk():
    uri = "ws://localhost:8000/ws/vehicles"
    print(f"Attempting to connect to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("🟢 Connected! Listening for live Budapest vehicle data...\n")
            while True:
                # Receive the JSON string from the FastAPI WebSocket
                message = await websocket.recv()
                data = json.loads(message)
                
                # Format the output for readability
                vid = data.get('vehicle_id', 'N/A')
                rid = data.get('route_id', 'N/A')
                lat = data.get('lat', 0.0)
                lon = data.get('lon', 0.0)
                
                print(f"🚍 Vehicle {vid} (Route {rid}) -> Location: {lat}, {lon}")
                
    except websockets.exceptions.ConnectionClosed:
        print("🔴 Connection closed by the server.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Run the async event loop
    asyncio.run(listen_to_bkk())