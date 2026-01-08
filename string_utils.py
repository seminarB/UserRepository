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


# テキストを複数の方法で分析し、その特性を辞書として返す。
#
# 引数:
# text -- 分析対象の文字列。
# mode -- 分析モード。'full' (詳細なカテゴリ分類、文字数、単語数)、'simple' (文字数、単語数のみ)、'detailed' (文字種別のカウント) のいずれか。デフォルトは 'full'。
#
# 戻り値:
# 分析結果を含む辞書。入力テキストが空の場合は `{"error": "Empty text"}` を返す。
#
# 制約事項:
# `mode`引数は'full', 'simple', 'detailed'のいずれかでなければなりません。これら以外の値が指定された場合、一部の分析結果のみが返される可能性があります。
#
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
 