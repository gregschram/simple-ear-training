// Manage category rotation to prevent repetition
(function() {
  // Initialize localStorage if not set
  if (!localStorage.getItem('spokenCategories')) {
    localStorage.setItem('spokenCategories', JSON.stringify([]));
  }
  if (!localStorage.getItem('writtenCategories')) {
    localStorage.setItem('writtenCategories', JSON.stringify([]));
  }
  
  // Track current session's categories to prevent immediate repeats
  const sessionCategories = {
    spoken: null,
    written: null
  };
  
  window.getNextCategory = function(type) {
    const allCategories = ['doctor', 'grocery', 'haircut'];
    const storageKey = type === 'spoken' ? 'spokenCategories' : 'writtenCategories';
    
    let recentCategories = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    // Filter out categories that were used in the last 3 selections
    // AND the category that was just used in this session
    let availableCategories = allCategories.filter(cat => {
      const notInRecent = recentCategories.length < 3 || 
                         !recentCategories.slice(-3).includes(cat);
      const notCurrentSession = cat !== sessionCategories[type];
      
      // Must pass both conditions
      return notInRecent && notCurrentSession;
    });
    
    // If no categories available (all were used recently), use any except the current session one
    if (availableCategories.length === 0) {
      availableCategories = allCategories.filter(cat => cat !== sessionCategories[type]);
      
      // If that still gives us nothing (shouldn't happen), reset history
      if (availableCategories.length === 0) {
        recentCategories = [];
        availableCategories = allCategories;
      }
    }
    
    // Get random category from available ones
    const selectedCategory = getRandomItem(availableCategories);
    
    // Store in session to prevent immediate repeats
    sessionCategories[type] = selectedCategory;
    
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