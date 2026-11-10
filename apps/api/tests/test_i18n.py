from app.utils.i18n import TRANSLATIONS, t


def test_known_keys_in_both_languages() -> None:
    assert t("game_ended", "en") == "Game over!"
    assert t("game_ended", "fr") == "Partie terminee !"


def test_regional_language_codes_resolve() -> None:
    assert t("game_ended", "fr-CA") == t("game_ended", "fr")
    assert t("game_ended", "FR") == t("game_ended", "fr")
    assert t("game_ended", "en_US") == t("game_ended", "en")


def test_unknown_language_falls_back_to_english() -> None:
    assert t("game_ended", "de") == t("game_ended", "en")
    assert t("game_ended", "") == t("game_ended", "en")


def test_unknown_key_returns_key() -> None:
    assert t("no_such_key", "fr") == "no_such_key"


def test_every_entry_has_en_and_fr() -> None:
    for key, entry in TRANSLATIONS.items():
        assert entry.get("en"), key
        assert entry.get("fr"), key
