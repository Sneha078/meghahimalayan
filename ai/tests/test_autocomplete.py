from search.query.autocomplete import Autocomplete


def test_autocomplete_brand_prefix():
    autocomplete = Autocomplete()

    results = autocomplete.search("oce")

    assert "Ocean Breeze Eau de Parfum" in results


def test_autocomplete_case_insensitive():
    autocomplete = Autocomplete()

    results = autocomplete.search("OCE")

    assert "Ocean Breeze Eau de Parfum" in results


def test_autocomplete_returns_empty_for_unknown_query():
    autocomplete = Autocomplete()

    results = autocomplete.search("xyzunknown")

    assert results == []


def test_autocomplete_empty_query():
    autocomplete = Autocomplete()

    results = autocomplete.search("")

    assert results == []


def test_autocomplete_limit():
    autocomplete = Autocomplete()

    results = autocomplete.search("c", limit=1)

    assert len(results) <= 1