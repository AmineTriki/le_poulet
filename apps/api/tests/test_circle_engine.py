import random

from app.services.circle_engine import MIN_RADIUS_M, initial_circle, shrink_circle
from app.utils.geo import haversine_distance

BAR = (45.5200, -73.5800)


def test_circle_always_contains_bar() -> None:
    """The chicken's bar must stay inside the circle at every shrink, whatever the jitter."""
    for seed in range(50):
        random.seed(seed)
        c = initial_circle(*BAR)
        for _ in range(15):
            c = shrink_circle(c, *BAR)
            assert haversine_distance(c.center_lat, c.center_lng, *BAR) < c.radius_m


def test_radius_never_below_minimum_and_decreasing() -> None:
    c = initial_circle(*BAR)
    previous = c.radius_m
    for _ in range(30):
        c = shrink_circle(c, *BAR)
        assert MIN_RADIUS_M <= c.radius_m <= previous
        previous = c.radius_m


def test_shrink_does_not_mutate_input() -> None:
    c = initial_circle(*BAR)
    shrink_circle(c, *BAR)
    assert c.shrink_count == 0
    assert c.radius_m == 1000.0
