import re

class CategorizationService:
    """
    Keyword-based expense categorization service.
    Designed with a modular architecture so ML (TF-IDF + Logistic Regression)
    can easily replace or augment the rule-based prediction.
    """

    KEYWORD_MAP = {
        "Food": [
            "food", "pizza", "burger", "dinner", "lunch", "breakfast", "restaurant",
            "cafe", "coffee", "starbucks", "swiggy", "zomato", "groceries", "supermarket",
            "bakery", "snack", "tea", "mcdonalds", "kfc", "dominos", "subway", "meal",
            "fruits", "vegetables", "milk"
        ],
        "Transport": [
            "uber", "ola", "cab", "taxi", "metro", "bus", "train", "fuel", "petrol",
            "diesel", "flight", "airfare", "parking", "toll", "auto", "railway",
            "college", "commute", "gas station"
        ],
        "Shopping": [
            "amazon", "flipkart", "shoes", "clothes", "dress", "mall", "electronics",
            "myntra", "zara", "h&m", "purchase", "apparel", "gadget", "laptop",
            "mobile", "headphone", "order", "store"
        ],
        "Entertainment": [
            "movie", "ticket", "cinema", "netflix", "prime", "hotstar", "spotify",
            "concert", "game", "gaming", "theatre", "show", "amusement", "party",
            "club", "outing", "disney"
        ],
        "Bills": [
            "bill", "electricity", "water", "wifi", "internet", "broadband", "mobile recharge",
            "dth", "utility", "gas bill", "phone bill", "maintenance", "power", "postpaid"
        ],
        "Education": [
            "fee", "tuition", "course", "udemy", "coursera", "books", "stationery",
            "exam", "school", "university", "seminar", "workshop", "tutorial"
        ],
        "Healthcare": [
            "medicine", "doctor", "hospital", "clinic", "pharmacy", "medical",
            "checkup", "dental", "dentist", "prescription", "lab", "test", "health"
        ],
        "Rent": [
            "rent", "house rent", "flat rent", "pg", "hostel", "room rent", "lease"
        ],
        "Savings": [
            "savings", "investment", "deposit", "mutual fund", "sip", "stocks",
            "fixed deposit", "emergency fund", "ppf", "gold"
        ],
    }

    @classmethod
    def predict_category(cls, description: str) -> str:
        if not description or not isinstance(description, str):
            return "Other"

        desc_lower = description.lower()
        # Clean special chars
        clean_text = re.sub(r"[^a-zA-Z0-9\s]", " ", desc_lower)
        tokens = set(clean_text.split())

        # Exact token match first
        for category, keywords in cls.KEYWORD_MAP.items():
            for kw in keywords:
                if " " in kw:
                    if kw in clean_text:
                        return category
                else:
                    if kw in tokens:
                        return category

        # Substring match fallback
        for category, keywords in cls.KEYWORD_MAP.items():
            for kw in keywords:
                if kw in desc_lower:
                    return category

        return "Other"
