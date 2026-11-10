import math

import pytest

from app.utils.geo import bbox_from_center, haversine_distance


def test_haversine_zero_distance() -> None:
    assert haversine_distance(45.5, -73.5, 45.5, -73.5) == 0.0


def test_haversine_known_distance() -> None:
    # Montreal -> Quebec City is roughly 233 km as the crow flies.
    d = haversine_distance(45.5017, -73.5673, 46.8139, -71.2080)
    assert 230_000 < d < 238_000


def test_haversine_symmetric() -> None:
    a = haversine_distance(45.5, -73.6, 45.52, -73.55)
    b = haversine_distance(45.52, -73.55, 45.5, -73.6)
    assert a == pytest.approx(b)


def test_haversine_antipodes_does_not_raise() -> None:
    d = haversine_distance(0.0, 0.0, 0.0, 180.0)
    assert d == pytest.approx(math.pi * 6_371_000.0, rel=1e-6)


def test_bbox_contains_center_and_scales_with_radius() -> None:
    s, w, n, e = bbox_from_center(45.5, -73.5, 1000)
    assert s < 45.5 < n
    assert w < -73.5 < e
    # ~1km in latitude is ~0.009 degrees
    assert n - s == pytest.approx(2 * 1000 / 111_000)
    # Longitude degrees are narrower than latitude degrees here, so the span is wider.
    assert (e - w) > (n - s)


def test_bbox_at_pole_is_finite() -> None:
    bbox = bbox_from_center(90.0, 0.0, 1000)
    assert all(math.isfinite(v) for v in bbox)
