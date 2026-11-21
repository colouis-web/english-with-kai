/* Kai's voyage (PO, 20/11) : ordre des ports, du mot le plus utile au plus rare.
   Listes de fréquence (anglais courant, adapté aux élèves de collège : on garde l'ordre des grands corpus mais les mots
   d'enfant passent avant les mots d'adulte de même fréquence). Un mot absent des dictionnaires est simplement ignoré ;
   un mot des dictionnaires absent de la liste vient après, rangé par sa classe de fréquence (f).
   Verbes : l'ordre de la liste USAGE (js/data/usage.js), déjà rangée par fréquence. */
"use strict";
const VY_FREQ = {
    nouns: ["time", "day", "year", "man", "woman", "child", "friend", "family", "school", "house", "life", "way", "hand", "eye", "head", "face",
        "water", "room", "mother", "father", "money", "book", "name", "night", "morning", "week", "month", "car", "city", "town", "door", "food",
        "game", "job", "boy", "girl", "kid", "baby", "dog", "cat", "teacher", "student", "class", "music", "film", "phone", "computer", "photo",
        "love", "place", "country", "street", "road", "shop", "table", "chair", "bed", "window", "garden", "kitchen", "bedroom", "bathroom",
        "floor", "wall", "light", "key", "cup", "glass", "hour", "minute", "second", "weekend", "birthday", "holiday", "trip", "sea", "beach",
        "sun", "rain", "weather", "snow", "sky", "tree", "flower", "animal", "bird", "fish", "horse", "ball", "team", "match", "player", "goal",
        "football", "song", "show", "answer", "lesson", "test", "exam", "homework", "subject", "maths", "history", "science", "art",
        "brother", "sister", "son", "daughter", "mum", "dad", "parent", "grandmother", "grandfather", "uncle", "aunt", "cousin", "husband", "wife",
        "person", "age", "number", "body", "hair", "nose", "mouth", "ear", "foot", "leg", "arm", "heart", "tooth", "back", "clothes", "shirt",
        "T-shirt", "shoe", "dress", "coat", "hat", "jacket", "jeans", "breakfast", "lunch", "dinner", "meal", "bread", "milk", "egg", "meat",
        "cheese", "apple", "fruit", "vegetable", "tea", "coffee", "juice", "drink", "chocolate", "cake", "pizza", "sandwich", "ice cream", "bus",
        "train", "plane", "bike", "boat", "ticket", "map", "hotel", "restaurant", "park", "hospital", "bank", "village", "mountain", "river",
        "lake", "forest", "island", "doctor", "nurse", "police officer", "farmer", "cook", "driver", "office", "library", "museum", "cinema",
        "supermarket", "airport", "train station", "toy", "video game", "card", "dream", "fun", "smile", "feeling", "fear", "hope", "friendship",
        "peace", "truth", "memory", "rule", "prize", "winner", "score", "level", "screen", "internet", "video", "app", "website", "pet", "puppy",
        "rabbit", "mouse", "chicken", "cow", "pig", "sheep", "lion", "tiger", "elephant", "monkey", "bear", "summer", "winter", "spring",
        "autumn", "season", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "January", "February", "March",
        "April", "May", "June", "July", "August", "September", "October", "November", "December", "classroom", "pupil", "uniform", "bag",
        "backpack", "pen", "pencil", "paper", "word", "question", "story", "idea", "problem", "picture", "party", "present", "letter", "box",
        "neighbour", "teenager", "adult", "boss", "captain", "king", "queen", "hero", "treasure", "ship", "ocean", "journey", "flag"],
    adjectives: ["good", "new", "big", "small", "little", "great", "long", "young", "bad", "happy", "nice", "important", "easy", "free", "true",
        "beautiful", "hot", "cold", "short", "tall", "fast", "slow", "strong", "funny", "kind", "clever", "interesting", "difficult", "tired",
        "hungry", "thirsty", "sad", "angry", "scared", "bored", "excited", "worried", "surprised", "friendly", "quiet", "warm", "sunny", "wet",
        "dry", "clean", "dirty", "heavy", "light", "pretty", "cute", "sweet", "lovely", "careful", "quick", "able", "brilliant", "safe",
        "serious", "rich", "poor", "cool", "ill", "alive", "bright", "clear", "deep", "red", "blue", "green", "yellow", "black", "white",
        "orange", "pink", "brown", "purple", "grey", "tiny", "huge", "delicious", "polite", "rude", "shy", "brave", "lazy", "patient", "curious",
        "proud", "calm", "nervous", "loud", "noisy", "English", "French", "British", "American", "Spanish", "Italian", "German", "Chinese",
        "Japanese", "terrible", "boring", "weak", "mean", "strange", "intelligent", "smart", "honest", "fair", "lonely", "unhappy", "helpful",
        "silly", "messy", "tidy", "clumsy", "talented", "neat", "untidy", "organised", "cloudy", "rainy", "windy", "snowy", "foggy"],
    adverbs: ["very", "now", "here", "there", "so", "too", "really", "well", "just", "only", "always", "never", "often", "sometimes",
        "usually", "today", "tomorrow", "yesterday", "soon", "later", "already", "still", "yet", "more", "most", "less", "a lot", "a little",
        "much", "maybe", "of course", "together", "home", "back", "up", "down", "early", "late", "outside", "inside", "quickly", "slowly",
        "probably", "almost", "enough", "ago", "before", "around", "right", "left", "over there", "every day", "tonight", "once", "everywhere",
        "somewhere", "far", "near", "away", "upstairs", "downstairs", "fast", "hard", "carefully", "quietly", "easily", "happily", "sadly",
        "suddenly", "alone", "perhaps", "quite", "rarely", "recently", "immediately", "abroad"]
};
