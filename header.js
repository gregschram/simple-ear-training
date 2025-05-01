document.addEventListener('DOMContentLoaded', function() {
  const header = document.createElement('header');
  header.className = 'site-header';
  
  // Load the Ko-fi widget script
  const kofiScript = document.createElement('script');
  kofiScript.type = 'text/javascript';
  kofiScript.src = 'https://storage.ko-fi.com/cdn/widget/Widget_2.js';
  document.head.appendChild(kofiScript);
  
  header.innerHTML = `
    <div class="header-inner">
      <a href="index.html"><img class="logo-img" src="/images/ep-logo-v1-white.png" alt="Ear-Practice logo"></a>
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
      kofiwidget2.init('Donate to support', 'BA594A', 'I3I71EBT3M');
      
      // Create a custom styled button instead of using kofiwidget2.draw()
      const kofiContainer = document.getElementById('kofi-button-container');
      
      const customButton = document.createElement('a');
      customButton.href = 'https://ko-fi.com/I3I71EBT3M';
      customButton.className = 'donate-btn tc-text';
      customButton.textContent = 'Donate to support';
      customButton.target = '_blank';
      customButton.rel = 'noopener noreferrer';
      
      kofiContainer.appendChild(customButton);
    }
  };
});