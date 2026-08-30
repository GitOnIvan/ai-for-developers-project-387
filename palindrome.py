def is_palindrome(word: str) -> bool:
    """Check whether a word is a palindrome.

    A palindrome is a word that reads the same forwards and backwards.
    The comparison is case-insensitive, so uppercase words like "Шалаш"
    also work.

    Args:
        word: The word to check.

    Returns:
        True if the word is a palindrome, False otherwise.
    """
    return word.lower() == word[::-1].lower()
