TRANSLATIONS: dict[str, dict[str, str]] = {
    "game_started": {"en": "The hunt has begun! 🐔", "fr": "La chasse commence ! 🐔"},
    "chicken_found": {"en": "CHICKEN FOUND!", "fr": "POULET TROUVE !"},
    "challenge_new": {"en": "New challenge!", "fr": "Nouveau defi !"},
    "game_ended": {"en": "Game over!", "fr": "Partie terminee !"},
    "weapon_air_strike": {"en": "Air Strike! 💣", "fr": "Frappe Aerienne ! 💣"},
    "weapon_spy": {"en": "Spy activated! 📡", "fr": "Espion active ! 📡"},
    "weapon_booby_trap": {"en": "Booby Trap set! ☠️", "fr": "Piege pose ! ☠️"},
    "weapon_steal": {"en": "Points stolen! 💰", "fr": "Points voles ! 💰"},
    "weapon_decoy": {"en": "Decoy deployed! 🐔", "fr": "Leurre deploye ! 🐔"},
    "weapon_silence": {"en": "Silenced! 🔇", "fr": "Reduit au silence ! 🔇"},
}


def t(key: str, language: str = "en") -> str:
    return TRANSLATIONS.get(key, {}).get(language, key)
