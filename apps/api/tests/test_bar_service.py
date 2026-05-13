from unittest.mock import AsyncMock

import pytest


@pytest.mark.asyncio
async def test_bar_service_returns_cached():
    mock_redis = AsyncMock()
    mock_redis.get.return_value = '[{"id": "osm:123", "name": "Le Bar"}]'
    from app.services.bar_service import search_bars

    result = await search_bars(45.5017, -73.5673, 1500, mock_redis)
    assert len(result) == 1
    assert result[0]["name"] == "Le Bar"
    assert result[0]["id"] == "osm:123"


@pytest.mark.asyncio
async def test_bar_service_cache_miss_calls_api():
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None

    mock_response_data = {
        "elements": [
            {
                "id": 999,
                "lat": 45.5017,
                "lon": -73.5673,
                "tags": {
                    "name": "Bar du Coin",
                    "amenity": "bar",
                    "addr:street": "Rue Saint-Denis",
                    "addr:housenumber": "42",
                },
            }
        ]
    }

    from unittest.mock import MagicMock, patch

    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = mock_response_data

    with patch("httpx.AsyncClient") as MockClient:
        MockClient.return_value.__aenter__ = AsyncMock(return_value=MockClient.return_value)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=None)
        MockClient.return_value.post = AsyncMock(return_value=mock_resp)

        from app.services.bar_service import search_bars

        await search_bars(45.5017, -73.5673, 500, mock_redis)

    assert mock_redis.setex.called


@pytest.mark.asyncio
async def test_bar_service_filters_unnamed():
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None

    mock_response_data = {
        "elements": [
            {"id": 1, "lat": 45.5, "lon": -73.5, "tags": {"amenity": "bar"}},  # no name
            {"id": 2, "lat": 45.5, "lon": -73.5, "tags": {"name": "Named Bar", "amenity": "pub"}},
        ]
    }

    from unittest.mock import MagicMock, patch

    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = mock_response_data

    with patch("httpx.AsyncClient") as MockClient:
        MockClient.return_value.__aenter__ = AsyncMock(return_value=MockClient.return_value)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=None)
        MockClient.return_value.post = AsyncMock(return_value=mock_resp)

        from app.services.bar_service import search_bars

        result = await search_bars(45.5017, -73.5673, 500, mock_redis)

    assert len(result) == 1
    assert result[0]["name"] == "Named Bar"
