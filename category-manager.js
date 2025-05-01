// Manage category rotation to prevent repetition
(function() {
  // Initialize localStorage if not set
  if (!localStorage.getItem('spokenCategories')) {
    localStorage.setItem('spokenCategories', JSON.stringify([]));
  }
  if (!localStorage.getItem('writtenCategories')) {
    localStorage.setItem('writtenCategories', JSON.stringify([]));
  }
  
  window.getNextCategory = function(type) {
    const allCategories = ['doctor', 'grocery', 'haircut'];
    const storageKey = type === 'spoken' ? 'spokenCategories' : 'writtenCategories';
    
    let recentCategories = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    // If we have 3+ categories in history, don't repeat the recent ones
    const availableCategories = allCategories.filter(cat => 
      recentCategories.length < 3 || !recentCategories.slice(-3).includes(cat)
    );
    
    // If no categories available (should be rare), reset history
    if (availableCategories.length === 0) {
      recentCategories = [];
      return getRandomItem(allCategories);
    }
    
    // Get random category from available ones
    const selectedCategory = getRandomItem(availableCategories);
    
    // Update history
    recentCategories.push(selectedCategory);
    if (recentCategories.length > 10) {
      recentCategories = recentCategories.slice(-10);
    }
    localStorage.setItem(storageKey, JSON.stringify(recentCategories));
    
    return selectedCategory;
  };
  
  function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
})();