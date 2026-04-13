// Simple Mock AI Service using Keyword Matching
// In a production app, you might connect this to a real NLP model (e.g., via Hugging Face or OpenAI)

const keywords = {
  'Roads': ['pothole', 'crack', 'road', 'street', 'broken pavement', 'asphalt', 'manhole'],
  'Garbage': ['trash', 'garbage', 'waste', 'smell', 'dump', 'dustbin', 'litter', 'overflowing', 'debris'],
  'Water': ['pipe', 'leak', 'water', 'flooding', 'drainage', 'sewage', 'clogged', 'drought'],
  'Electricity': ['streetlight', 'street light', 'light', 'dark', 'bulb', 'wire', 'electricity', 'power outage', 'shock', 'spark', 'pole']
};

/**
 * Predicts the category based on text content.
 * @param {string} title 
 * @param {string} description 
 * @returns {string} The predicted category, or 'Others' if no match.
 */
function suggestCategory(title, description) {
  if (!title && !description) return 'Others';

  const combinedText = `${title} ${description}`.toLowerCase();
  
  // Create a scoring mechanism
  const scores = {
    'Roads': 0,
    'Garbage': 0,
    'Water': 0,
    'Electricity': 0
  };

  // Check against all keywords
  for (const [category, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (combinedText.includes(word)) {
        // Higher weight for longer (more specific) keywords
        // e.g., 'streetlight' (length 11) will score higher than 'street' (length 6)
        scores[category] += word.length; 
      }
    }
  }

  // Find the category with the highest score
  let maxScore = 0;
  let bestCategory = 'Others';

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

module.exports = { suggestCategory };
