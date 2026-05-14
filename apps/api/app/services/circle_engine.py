import math
import random
from dataclasses import dataclass

INITIAL_RADIUS_M = 1000.0
MIN_RADIUS_M = 75.0
JITTER_FACTOR = 0.15


@dataclass
class CircleState:
    center_lat: float
    center_lng: float
    radius_m: float
    shrink_count: int = 0


def shrink_circle(state: CircleState, bar_lat: float, bar_lng: float) -> CircleState:
    new_radius = max(state.radius_m * 0.6, MIN_RADIUS_M)

    jitter_m = new_radius * JITTER_FACTOR
    jitter_lat = (random.random() - 0.5) * 2 * jitter_m / 111_000
    jitter_lng = (random.random() - 0.5) * 2 * jitter_m / (111_000 * math.cos(math.radians(bar_lat)))

    alpha = 1 - (new_radius / INITIAL_RADIUS_M)
    new_lat = state.center_lat + (bar_lat - state.center_lat) * alpha + jitter_lat
    new_lng = state.center_lng + (bar_lng - state.center_lng) * alpha + jitter_lng

    return CircleState(
        center_lat=new_lat,
        center_lng=new_lng,
        radius_m=new_radius,
        shrink_count=state.shrink_count + 1,
    )


def initial_circle(city_lat: float, city_lng: float) -> CircleState:
    return CircleState(
        center_lat=city_lat,
        center_lng=city_lng,
        radius_m=INITIAL_RADIUS_M,
    )
