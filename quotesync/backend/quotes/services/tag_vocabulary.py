"""
Predefined tag vocabulary for the quote tagging system.
"""

# Standard tag categories with their corresponding tags
STANDARD_TAGS = {
    'emotions': [
        'happiness', 'joy', 'sadness', 'anger', 'fear', 'love', 'hate', 
        'passion', 'hope', 'despair', 'anxiety', 'gratitude', 'guilt', 
        'empathy', 'compassion', 'shame', 'pride', 'jealousy', 'grief'
    ],
    
    'virtues': [
        'courage', 'wisdom', 'patience', 'honesty', 'integrity', 'kindness', 
        'generosity', 'humility', 'perseverance', 'responsibility', 'forgiveness',
        'loyalty', 'self-discipline', 'respect', 'tolerance'
    ],
    
    'relationships': [
        'friendship', 'family', 'marriage', 'partnership', 'community', 'trust',
        'betrayal', 'reconciliation', 'communication', 'connection', 'parenting',
        'teamwork', 'collaboration', 'leadership', 'mentorship'
    ],
    
    'life': [
        'success', 'failure', 'growth', 'change', 'adversity', 'opportunity',
        'experience', 'journey', 'destiny', 'purpose', 'meaning', 'commitment',
        'adventure', 'challenge', 'possibility', 'transformation', 'achievement'
    ],
    
    'knowledge': [
        'education', 'learning', 'wisdom', 'knowledge', 'understanding', 'truth',
        'science', 'discovery', 'curiosity', 'insight', 'creativity', 'innovation',
        'reflection', 'study', 'research', 'teaching', 'intelligence'
    ],
    
    'society': [
        'justice', 'freedom', 'equality', 'democracy', 'peace', 'war', 'politics',
        'government', 'leadership', 'progress', 'tradition', 'culture', 'diversity',
        'unity', 'community', 'social change', 'human rights', 'responsibility'
    ],
    
    'philosophy': [
        'truth', 'reality', 'existence', 'meaning', 'purpose', 'morality', 'ethics',
        'logic', 'reason', 'consciousness', 'perception', 'belief', 'knowledge',
        'wisdom', 'freedom', 'determinism', 'identity', 'mind', 'spirituality'
    ],
    
    'time': [
        'past', 'present', 'future', 'memory', 'history', 'moment', 'eternity',
        'transience', 'permanence', 'beginnings', 'endings', 'legacy', 'aging',
        'youth', 'mortality', 'immortality', 'time management', 'patience'
    ],
    
    'nature': [
        'nature', 'environment', 'earth', 'animals', 'plants', 'wilderness',
        'conservation', 'sustainability', 'ecology', 'climate', 'seasons',
        'beauty', 'simplicity', 'harmony', 'balance', 'cycles', 'growth'
    ],
    
    'art': [
        'creativity', 'expression', 'beauty', 'inspiration', 'imagination',
        'literature', 'poetry', 'music', 'painting', 'writing', 'perspective',
        'interpretation', 'aesthetics', 'self-expression', 'culture'
    ],
    
    'work': [
        'work', 'career', 'ambition', 'success', 'achievement', 'dedication',
        'effort', 'discipline', 'motivation', 'purpose', 'craft', 'service',
        'excellence', 'productivity', 'profession', 'legacy', 'mastery'
    ],
    
    'spirituality': [
        'faith', 'belief', 'soul', 'spirituality', 'religion', 'divine', 'sacred',
        'meditation', 'prayer', 'mindfulness', 'enlightenment', 'transcendence',
        'meaning', 'purpose', 'connection', 'tradition', 'ritual'
    ],
    
    'self': [
        'identity', 'self-awareness', 'authenticity', 'confidence', 'self-esteem',
        'self-improvement', 'self-acceptance', 'self-care', 'mindfulness', 'growth',
        'potential', 'purpose', 'integrity', 'character', 'values', 'personality'
    ],
    
    'health': [
        'health', 'well-being', 'healing', 'fitness', 'nutrition', 'mental health',
        'balance', 'self-care', 'mindfulness', 'rest', 'energy', 'prevention',
        'medicine', 'therapy', 'recovery', 'renewal', 'vitality'
    ],
    
    'challenges': [
        'adversity', 'struggle', 'hardship', 'resilience', 'perseverance', 'endurance',
        'obstacles', 'problems', 'conflict', 'crisis', 'difficulty', 'setback',
        'suffering', 'challenge', 'overcoming', 'survival', 'strength'
    ],
}

# Flatten the list and remove duplicates to create a complete tag vocabulary
TAG_VOCABULARY = list(set([tag for category_tags in STANDARD_TAGS.values() for tag in category_tags]))

# Sort alphabetically for easier reference
TAG_VOCABULARY.sort()

def get_all_tags():
    """Return the complete list of available tags."""
    return TAG_VOCABULARY

def get_tags_by_category():
    """Return tags organized by category."""
    return STANDARD_TAGS

def get_category_for_tag(tag):
    """Find which category a tag belongs to."""
    for category, tags in STANDARD_TAGS.items():
        if tag in tags:
            return category
    return None 