from fastapi import APIRouter

router = APIRouter()

COSTUME_PRODUCTS = [
    {
        "id": "full_deluxe",
        "name_en": "Full Deluxe Chicken Suit",
        "name_fr": "Costume Poulet Deluxe Complet",
        "price_usd": 65,
        "amazon_url": "https://amazon.com/dp/B08EXAMPLE1",
        "image_url": "/costumes/full_deluxe.jpg",
        "type": "full",
        "description_en": "The full enchilada. Head-to-toe chicken glory. If you are the Chicken, this earns you 2x points. If you are a hunter, you are just unhinged — we respect that.",
        "description_fr": "Le costume complet. De la tete aux pieds. Si tu es le Poulet, ca te donne 2x les points. Si tu es un chasseur, t'es juste bizarre — on respecte ca.",
    },
    {
        "id": "head_only",
        "name_en": "Chicken Head Only",
        "name_fr": "Tete de Poulet Seulement",
        "price_usd": 14.99,
        "amazon_url": "https://amazon.com/dp/B08EXAMPLE2",
        "image_url": "/costumes/head_only.jpg",
        "type": "head",
        "description_en": "Budget option. Still terrifying. Works great for bar entrances and confusing bartenders.",
        "description_fr": "Option economique. Toujours terrifiant. Parfait pour les entrees de bar et pour perturber les barmen.",
    },
    {
        "id": "inflatable",
        "name_en": "Inflatable Chicken Suit",
        "name_fr": "Costume Poulet Gonflable",
        "price_usd": 29.99,
        "amazon_url": "https://amazon.com/dp/B08EXAMPLE3",
        "image_url": "/costumes/inflatable.jpg",
        "type": "inflatable",
        "description_en": "The chaos choice. Inflatable, ridiculous, impossible to run in. Perfect for the Chicken who wants to be found eventually.",
        "description_fr": "Le choix chaos. Gonflable, ridicule, impossible a courir dedans. Parfait pour le Poulet qui veut se faire trouver a un moment donne.",
    },
    {
        "id": "wings_only",
        "name_en": "Chicken Wings Wearable",
        "name_fr": "Ailes de Poulet Portables",
        "price_usd": 12.99,
        "amazon_url": "https://amazon.com/dp/B08EXAMPLE4",
        "image_url": "/costumes/wings_only.jpg",
        "type": "accessories",
        "description_en": "Just the wings. Minimal commitment, maximum vibe. Flap them when excited — which should be always.",
        "description_fr": "Juste les ailes. Engagement minimal, ambiance maximale. Bats-les quand tu es excite — ce qui devrait etre tout le temps.",
    },
    {
        "id": "beak_glasses",
        "name_en": "Chicken Beak Glasses",
        "name_fr": "Lunettes Bec de Poulet",
        "price_usd": 7.99,
        "amazon_url": "https://amazon.com/dp/B08EXAMPLE5",
        "image_url": "/costumes/beak_glasses.jpg",
        "type": "accessories",
        "description_en": "Subtle. Classy. Unmistakably a bird. Great for the undercover Chicken.",
        "description_fr": "Subtil. Classe. Incontestablement un oiseau. Super pour le Poulet en mission d infiltration.",
    },
]


@router.get("/")
async def list_costumes() -> list[dict]:
    return COSTUME_PRODUCTS
