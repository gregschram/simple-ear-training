document.addEventListener('DOMContentLoaded', function() {
  const header = document.createElement('header');
  header.className = 'site-header';
  
  // Determine if we're on mobile
  const isMobile = window.innerWidth <= 768;
  
  // Use the new SVG logo for all screen sizes
  const logoSrc = "/images/ep-logo-knockout.svg";
  
  // Choose appropriate donation text based on screen size
  const donateText = isMobile ? "Donate" : "Donate to support";
  
  // Load the Ko-fi widget script
  const kofiScript = document.createElement('script');
  kofiScript.type = 'text/javascript';
  kofiScript.src = 'https://storage.ko-fi.com/cdn/widget/Widget_2.js';
  document.head.appendChild(kofiScript);
  
  // Create header with horizontal layout
  header.innerHTML = `
    <div class="header-inner">
      <a href="index.html"><img class="logo-img" src="${logoSrc}" alt="Ear-Practice logo"></a>
      <nav>
        <a href="about.html">About</a>
        <div id="kofi-button-container" class="donate-btn-container"></div>
      </nav>
    </div>
  `;
  
  // Insert the header at the beginning of the body
  document.body.insertBefore(header, document.body.firstChild);
  
  // Initialize the Ko-fi button after ensuring the script is loaded
  kofiScript.onload = function() {
    if (typeof kofiwidget2 !== 'undefined') {
      // Initialize with your colors
      kofiwidget2.init(donateText, 'BA594A', 'I3I71EBT3M');
      
      // Create a custom styled button instead of using kofiwidget2.draw()
      const kofiContainer = document.getElementById('kofi-button-container');
      
      const customButton = document.createElement('a');
      customButton.href = 'https://ko-fi.com/I3I71EBT3M';
      customButton.className = 'donate-btn tc-text';
      customButton.textContent = donateText;
      customButton.target = '_blank';
      customButton.rel = 'noopener noreferrer';
      
      kofiContainer.appendChild(customButton);
    }
  };
  
  // Update on resize
  window.addEventListener('resize', function() {
    const isMobileNow = window.innerWidth <= 768;
    
    // Only update if mobile state changed
    if (isMobileNow !== isMobile) {
      // Reload the page to apply new header (simple approach)
      location.reload();
    }
  });
});