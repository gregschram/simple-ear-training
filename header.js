document.addEventListener('DOMContentLoaded', function() {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="header-inner">
      <a href="index.html"><img class="logo-img" src="/images/ep-logo-v1-white.png" alt="Ear-Practice logo"></a>
      <nav>
        <a href="about.html">About</a>
        <a href="donate.html" class="donate-btn">Donate</a>
      </nav>
    </div>
  `;
  
  // Insert the header at the beginning of the body
  document.body.insertBefore(header, document.body.firstChild);
});