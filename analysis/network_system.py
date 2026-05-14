from dataclasses import dataclass
from typing import Dict, List, Set

@dataclass(frozen=True)
class StationNode:
    id: str
    name: str
    lat: float
    lon: float
    is_accessible: bool

class StationGraph:
    def __init__(self):
        self.adj: Dict[str, List[str]] = {}
        self.nodes: Dict[str, StationNode] = {}

    def add_station(self, node: StationNode):
        self.nodes[node.id] = node
        if node.id not in self.adj:
            self.adj[node.id] = []

    def add_connection(self, u: str, v: str):
        if u in self.adj and v not in self.adj[u]:
            self.adj[u].append(v)

    def get_reachable(self, start_id, accessible_only=True):
        if start_id not in self.nodes:
            return set()
        
        visited, queue = {start_id}, [start_id]
        
        while queue:
            curr = queue.pop(0)
            for neighbor in self.adj.get(curr, []):
                if neighbor in self.nodes and neighbor not in visited:
                    if not accessible_only or self.nodes[neighbor].is_accessible:
                        visited.add(neighbor)
                        queue.append(neighbor)
        return visited