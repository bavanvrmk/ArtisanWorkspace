"""
Government Schemes Dataset
==========================
Contains eligibility rules for major Indian government schemes
relevant to artisans and craftworkers. Used by the /api/schemes/match
endpoint to determine artisan eligibility.
"""

SCHEMES = [
    {
        "scheme_id": "sch_01",
        "name": "PM Vishwakarma Yojana",
        "ministry": "Ministry of Micro, Small & Medium Enterprises",
        "benefit": "Subsidized loan up to ₹3 Lakh at 5% interest, free toolkit, skill training & certification",
        "eligibility": {
            "max_annual_income": 500000,
            "craft_types": None,  # All craft types
            "min_age": 18,
            "max_age": None,
            "gender": None,  # All genders
            "states": None,  # All states
        },
        "link": "https://pmvishwakarma.gov.in",
    },
    {
        "scheme_id": "sch_02",
        "name": "MUDRA Loan — Shishu Category",
        "ministry": "Ministry of Finance",
        "benefit": "Collateral-free business loan up to ₹50,000 for micro enterprises",
        "eligibility": {
            "max_annual_income": 300000,
            "craft_types": None,
            "min_age": 18,
            "max_age": None,
            "gender": None,
            "states": None,
        },
        "link": "https://www.mudra.org.in",
    },
    {
        "scheme_id": "sch_03",
        "name": "Stand-Up India Scheme",
        "ministry": "Ministry of Finance",
        "benefit": "Bank loan between ₹10 Lakh and ₹1 Crore for SC/ST and women entrepreneurs",
        "eligibility": {
            "max_annual_income": None,
            "craft_types": None,
            "min_age": 18,
            "max_age": None,
            "gender": "female",  # Targeted at women (and SC/ST)
            "states": None,
        },
        "link": "https://www.standupmitra.in",
    },
    {
        "scheme_id": "sch_04",
        "name": "National Handicraft Development Programme",
        "ministry": "Ministry of Textiles",
        "benefit": "Design workshops, marketing support, craft bazaar participation, and raw material assistance",
        "eligibility": {
            "max_annual_income": 400000,
            "craft_types": [
                "Pottery", "Ceramics", "Metal Craft", "Dhokra",
                "Folk Painting", "Madhubani", "Stone Carving",
                "Woodwork", "Basketry", "Embroidery", "Handicraft",
            ],
            "min_age": 18,
            "max_age": None,
            "gender": None,
            "states": None,
        },
        "link": "https://handicrafts.nic.in",
    },
    {
        "scheme_id": "sch_05",
        "name": "Handloom Weavers' MUDRA Loan Scheme",
        "ministry": "Ministry of Textiles",
        "benefit": "Concessional loan up to ₹10 Lakh for handloom weavers with margin money assistance",
        "eligibility": {
            "max_annual_income": 500000,
            "craft_types": ["Handloom Weaving", "Banarasi", "Weaving"],
            "min_age": 18,
            "max_age": None,
            "gender": None,
            "states": None,
        },
        "link": "https://handlooms.nic.in",
    },
    {
        "scheme_id": "sch_06",
        "name": "PM Jan Dhan Yojana — Overdraft Facility",
        "ministry": "Ministry of Finance",
        "benefit": "Overdraft facility up to ₹10,000 with zero-balance Jan Dhan bank account and RuPay debit card",
        "eligibility": {
            "max_annual_income": 200000,
            "craft_types": None,
            "min_age": 18,
            "max_age": None,
            "gender": None,
            "states": None,
        },
        "link": "https://pmjdy.gov.in",
    },
    {
        "scheme_id": "sch_07",
        "name": "One District One Product (ODOP) Scheme",
        "ministry": "Ministry of Food Processing Industries / DPIIT",
        "benefit": "Marketing, branding, and export support for district-specific traditional crafts",
        "eligibility": {
            "max_annual_income": None,
            "craft_types": None,
            "min_age": None,
            "max_age": None,
            "gender": None,
            "states": [
                "Uttar Pradesh", "Rajasthan", "Bihar", "Chhattisgarh",
                "Madhya Pradesh", "Gujarat", "Tamil Nadu", "West Bengal",
                "Odisha", "Karnataka",
            ],
        },
        "link": "https://odop.mofpi.gov.in",
    },
]


def match_schemes(
    craft_type: str = None,
    age: int = None,
    annual_income: float = None,
    gender: str = None,
    state: str = None,
) -> list[dict]:
    """
    Match an artisan's profile against all schemes and return eligible ones.

    Parameters
    ----------
    craft_type : str — Artisan's craft type (e.g. 'Pottery', 'Handloom Weaving')
    age : int — Artisan's age
    annual_income : float — Artisan's annual income in INR
    gender : str — 'male', 'female', or 'other'
    state : str — Artisan's state

    Returns
    -------
    list of scheme dicts that the artisan is eligible for
    """
    eligible = []

    for scheme in SCHEMES:
        rules = scheme["eligibility"]
        is_eligible = True

        # Check income
        if rules["max_annual_income"] is not None and annual_income is not None:
            if annual_income > rules["max_annual_income"]:
                is_eligible = False

        # Check age
        if rules["min_age"] is not None and age is not None:
            if age < rules["min_age"]:
                is_eligible = False
        if rules["max_age"] is not None and age is not None:
            if age > rules["max_age"]:
                is_eligible = False

        # Check craft type
        if rules["craft_types"] is not None and craft_type is not None:
            allowed = {c.lower() for c in rules["craft_types"]}
            if craft_type.lower() not in allowed:
                is_eligible = False

        if rules["gender"] is not None and gender is not None:
            if gender.lower() != str(rules["gender"]).lower():
                is_eligible = False

        # Check state
        if rules["states"] is not None and state is not None:
            if state not in rules["states"]:
                is_eligible = False

        if is_eligible:
            eligible.append({
                "scheme_id": scheme["scheme_id"],
                "name": scheme["name"],
                "ministry": scheme["ministry"],
                "benefit": scheme["benefit"],
                "link": scheme["link"],
            })

    return eligible
