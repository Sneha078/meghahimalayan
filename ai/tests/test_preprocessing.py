from search.query.preprocessing import normalize_query, tokenize


def test_lowercase():
    assert normalize_query("DIOR SAUVAGE") == "dior sauvage"


def test_whitespace():
    assert normalize_query("  seiko    watch  ") == "seiko watch"


def test_price_rs():
    assert normalize_query("Rs. 2,500 watch") == "2500 watch"


def test_price_rs_without_period():
    assert normalize_query("Rs 2,500 watch") == "2500 watch"


def test_price_nepali_currency():
    assert normalize_query("रु. 2,500 watch") == "2500 watch"


def test_hyphen():
    assert normalize_query("Ray-Ban Classic") == "ray-ban classic"


def test_punctuation():
    assert normalize_query("Dior, Sauvage!") == "dior sauvage"


def test_tokenize():
    assert tokenize("  Seiko Silver Watch  ") == [
        "seiko",
        "silver",
        "watch",
    ]


def test_empty_query():
    assert normalize_query("") == ""
    assert tokenize("") == []