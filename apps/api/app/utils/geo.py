import json
import math
from pathlib import Path
from typing import Any


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def bbox_from_center(lat: float, lng: float, radius_m: float) -> tuple[float, float, float, float]:
    delta_lat = radius_m / 111_000
    delta_lng = radius_m / (111_000 * math.cos(math.radians(lat)))
    return lat - delta_lat, lng - delta_lng, lat + delta_lat, lng + delta_lng


def get_city_config(city_slug: str) -> dict[str, Any] | None:
    path = Path(__file__).parent.parent.parent / "data" / "cities.json"
    cities: dict[str, Any] = json.loads(path.read_text())
    return cities.get(city_slug.lower())
