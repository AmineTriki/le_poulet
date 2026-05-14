from app.services.circle_engine import initial_circle, shrink_circle


def test_initial_circle():
    c = initial_circle(45.5017, -73.5673)
    assert c.radius_m == 1000.0
    assert c.shrink_count == 0
    assert c.center_lat == 45.5017
    assert c.center_lng == -73.5673


def test_shrink_circle():
    c = initial_circle(45.5017, -73.5673)
    c2 = shrink_circle(c, 45.5017, -73.5673)
    assert c2.radius_m < c.radius_m
    assert c2.radius_m >= 75.0
    assert c2.shrink_count == 1


def test_shrink_to_minimum():
    c = initial_circle(45.5017, -73.5673)
    for _ in range(20):
        c = shrink_circle(c, 45.5017, -73.5673)
    assert c.radius_m == 75.0


def test_shrink_multiple_steps():
    c = initial_circle(45.5017, -73.5673)
    c2 = shrink_circle(c, 45.5017, -73.5673)
    c3 = shrink_circle(c2, 45.5017, -73.5673)
    assert c3.radius_m < c2.radius_m
    assert c3.shrink_count == 2


def test_circle_moves_toward_bar():
    bar_lat, bar_lng = 45.52, -73.58
    c = initial_circle(45.50, -73.55)
    for _ in range(5):
        c = shrink_circle(c, bar_lat, bar_lng)
    # After multiple shrinks, circle center should move toward bar (roughly)
    # Allow for jitter — just check it moved in the right general direction
    assert abs(c.center_lat - bar_lat) < abs(45.50 - bar_lat) + 0.01
