def reverse_string(text): 
    return text[::-1]


def count_words(text):
    if not text:
        return 0
    return len(text.split())


def capitalize_words(text):
    words = text.split()
    capitalized = [word.capitalize() for word in words]
    return ' '.join(capitalized)


def remove_whitespace(text):
    return ''.join(text.split())


def is_palindrome(text):
    cleaned = text.lower().replace(' ', '')
    return cleaned == cleaned[::-1]


def find_substring(text, substring):
    return text.find(substring)


def replace_text(text, old, new):
    return text.replace(old, new)
