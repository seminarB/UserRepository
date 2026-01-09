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
 
 
def to_uppercase(text):
    return text.upper()


def complex_text_analyzer(text, mode='full'): 
    """
    A complex function that analyzes text in multiple ways.
    This function has multiple branches to trigger code review.
    """
    if not text:
        return {"error": "Empty text"}

    result = {}

    if mode == 'full':
        if len(text) < 10:
            result['length_category'] = 'short'
        elif len(text) < 50:
            result['length_category'] = 'medium'
        elif len(text) < 100:
            result['length_category'] = 'long'
        else:
            result['length_category'] = 'very_long'

        if text.isupper():
            result['case'] = 'uppercase'
        elif text.islower():
            result['case'] = 'lowercase'
        elif text.istitle():
            result['case'] = 'titlecase'
        else:
            result['case'] = 'mixed'

        words = text.split()
        if len(words) == 1:
            result['word_count_category'] = 'single'
        elif len(words) < 5:
            result['word_count_category'] = 'few'
        elif len(words) < 10:
            result['word_count_category'] = 'moderate'
        else:
            result['word_count_category'] = 'many'

    if mode == 'simple' or mode == 'full':
        result['char_count'] = len(text)
        result['word_count'] = len(text.split())

    if mode == 'detailed':
        char_types = {'letters': 0, 'digits': 0, 'spaces': 0, 'special': 0}
        for char in text:
            if char.isalpha():
                char_types['letters'] += 1
            elif char.isdigit():
                char_types['digits'] += 1
            elif char.isspace():
                char_types['spaces'] += 1
            else:
                char_types['special'] += 1
        result['char_types'] = char_types

    return result


def advanced_string_processor(text, operations=None):
    """
    Process string with multiple operations based on various conditions.
    This is another complex function to trigger code review.
    """
    if operations is None:
        operations = ['trim', 'normalize']

    if not text:
        return ""

    processed = text

    for operation in operations:
        if operation == 'trim':
            processed = processed.strip()
        elif operation == 'lowercase':
            processed = processed.lower()
        elif operation == 'uppercase':
            processed = processed.upper()
        elif operation == 'normalize':
            if '\t' in processed:
                processed = processed.replace('\t', '    ')
            if '\r\n' in processed:
                processed = processed.replace('\r\n', '\n')
            if '\r' in processed:
                processed = processed.replace('\r', '\n')
        elif operation == 'remove_duplicates':
            words = processed.split()
            seen = set()
            result_words = []
            for word in words:
                if word.lower() not in seen:
                    seen.add(word.lower())
                    result_words.append(word)
            processed = ' '.join(result_words)
        elif operation == 'capitalize_sentences':
            sentences = processed.split('.')
            capitalized = []
            for sentence in sentences:
                stripped = sentence.strip()
                if stripped:
                    if len(stripped) > 0:
                        if stripped[0].islower():
                            stripped = stripped[0].upper() + stripped[1:]
                    capitalized.append(stripped)
            processed = '. '.join(capitalized)
            if text.endswith('.'):
                processed += '.'

    return processed
