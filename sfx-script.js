window.goHome ||= () => location.href = 'index.html';

import { soundEffects } from './sound-effects.js';
let score = 0;
let attempts = 0;
let roundData = [];
let currentRound = 0;
const totalRounds = 10;
let firstTryCorrect = 0;
let attemptsInCurrentRound = 0;
let answerHistory = [];

// Audio-related variables
let audio = new Audio();  // We'll keep this one instead of audioElement
let audioContext = null;
let gainNode = null;

// graceful fallback now that the button is an <a>
const homeBtn = document.getElementById('home-button') || document.querySelector('.back-link');
if (homeBtn) homeBtn.onclick = () => location.href = '/index.html';

// Update play button and feedback display
document.getElementById("play-sound").textContent = "▶";

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
}

function playWithFade() {
    try {
        const currentSource = audioContext.createMediaElementSource(audio);
        currentSource.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.2);
        
        audio.addEventListener('timeupdate', function() {
            if (audio.duration - audio.currentTime <= 0.2) {
                gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
            }
        }, { once: true });  // Use once:true so the listener is automatically removed
        
        audio.play();
    } catch (e) {
        console.log('Audio play error:', e);
        // Simple fallback without fade
        audio.play();
    }
}

document.getElementById("play-sound").onclick = () => {
    playWithFade();
};

async function loadCategoryData() {
    try {
        // Get effects from our generated data file
        roundData = soundEffects.effects.map(effect => ({
            audioPath: effect.audioPath,
            imagePath: effect.imagePath,
            name: effect.id
        }));
        
        // Randomize and slice to 10 rounds
        roundData = roundData.sort(() => 0.5 - Math.random()).slice(0, totalRounds);
        loadRound();
    } catch (error) {
        console.error("Error loading sound effects data:", error);
        alert("Failed to load the sound effects.");
        goHome();
    }
}

function loadRound() {
  attemptsInCurrentRound = 0;
  const round = roundData[currentRound];
  
  document.getElementById("feedback").textContent = "";
  document.getElementById("next-button").style.display = "none";
  document.getElementById("round-tracker").textContent = `Round ${currentRound + 1}/${totalRounds}`;
  
  // Get 3 random different options for incorrect choices
  const otherOptions = roundData
      .filter(r => r !== round)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  
  // Combine correct option with random ones and shuffle
  const allOptions = [round, ...otherOptions]
      .sort(() => Math.random() - 0.5);
  
  // Create image grid
  const choicesContainer = document.getElementById("choices");
  choicesContainer.innerHTML = "";
  choicesContainer.className = "image-grid";
  
  // Pre-create all buttons but keep them hidden
  const buttons = [];
  
  allOptions.forEach((option) => {
      const button = document.createElement("button");
      button.className = "image-choice";
      button.style.opacity = "0";
      button.style.transition = "opacity 0.5s ease";
      button.onclick = () => checkAnswer(button, option === round);
      
      // Create an img element for the image
      const img = document.createElement("img");
      img.src = option.imagePath;
      img.alt = option.name;
      
      button.appendChild(img);
      choicesContainer.appendChild(button);
      buttons.push(button);
  });
  
  // Define the animation order (clockwise from top-left)
  const animationOrder = [0, 1, 3, 2]; // top-left, top-right, bottom-right, bottom-left
  
  // Animate each button with a delay
  animationOrder.forEach((index, i) => {
      setTimeout(() => {
          if (buttons[index]) {
              buttons[index].style.opacity = "1";
          }
      }, i * 250);
  });
  
  // Preload audio
  audio.src = round.audioPath;
  audio.load();
  
  // Play initial sound after a short delay
  if (currentRound === 0) {
      setTimeout(() => playWithFade(), 750);
  }
}

// Align feedback and next button layout to prevent shifting
function checkAnswer(element, isCorrect) {
    console.log("checkAnswer called", { isCorrect });
    attemptsInCurrentRound++;
    const feedback = document.getElementById("feedback");
    const nextButton = document.getElementById("next-button");
    
    if (isCorrect) {
        if (attemptsInCurrentRound === 1) {
            firstTryCorrect++;
            answerHistory[currentRound] = true;
        } else {
            answerHistory[currentRound] = false;
        }
        score++;
        element.classList.add("correct");
        element.classList.add("selected");
        feedback.textContent = "Correct!";
        feedback.className = "correct";
        document.getElementById("next-button").style.display = "block";
        document.getElementById("next-button").classList.add("visible"); // Add this line
        disableAllChoices();
        createCelebration();
        console.log("Correct answer processed");
    } else {
        element.classList.add("incorrect");
        element.classList.add("selected");
        element.style.pointerEvents = "none";
        feedback.textContent = "Not quite. Have another listen.";
        feedback.className = "incorrect";
        console.log("Incorrect answer processed");
    }
}


// ... rest of the shared functions (createCelebration, showEndGame, etc.) remain the same ...
// CELEBRATION ANIMATIONS ADDED HERE
function createCelebration() {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    document.body.appendChild(celebration);
    
    // Create particles in a circular pattern
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'celebration-particle';
        
        // Calculate position around the center
        const angle = (i / 20) * Math.PI * 2;
        const x = 50 + Math.cos(angle) * 30;
        const y = 50 + Math.sin(angle) * 30;
        
        particle.style.left = `${x}%`;
        particle.style.top = `${y}%`;
        particle.style.backgroundColor = ['#4CAF50', '#2196F3', '#FFC107'][Math.floor(Math.random() * 3)];
        
        celebration.appendChild(particle);
    }
    
    setTimeout(() => celebration.remove(), 1000);
}

function addSparkleEffect(container) {
   function createSparkle() {
       const sparkle = document.createElement('div');
       sparkle.className = 'sparkle';
       document.body.appendChild(sparkle);
    
       const sparkleEmoji = document.createElement('span');
       sparkleEmoji.textContent = '✨';
    
       // Random size (3 distinct sizes)
       const sizes = ['16px', '20px', '24px'];
       const size = sizes[Math.floor(Math.random() * sizes.length)];
       sparkleEmoji.style.fontSize = size;
    
       // Position within viewport with padding from edges
       const viewportWidth = window.innerWidth;
       const viewportHeight = window.innerHeight;
       sparkleEmoji.style.left = (Math.random() * (viewportWidth - 40) + 20) + 'px';
       sparkleEmoji.style.top = (Math.random() * (viewportHeight - 40) + 20) + 'px';
    
       sparkle.appendChild(sparkleEmoji);
    
       setTimeout(() => sparkle.remove(), 4000);
    }

    // Create initial set of sparkles
    for(let i = 0; i < 5; i++) {
        createSparkle();
    }
    
    // Continuously maintain 3-5 sparkles
    const interval = setInterval(() => {
        const currentSparkles = document.getElementsByClassName('sparkle').length;
        if (currentSparkles < 3) {
            for(let i = 0; i < 2; i++) {
                createSparkle();
            }
        }
    }, 1000);

    return () => clearInterval(interval);
}

function disableAllChoices() {
    document.querySelectorAll(".image-choice").forEach(button => {
        button.disabled = true;
    });
}

function loadNextRound() {
    console.log("Loading the next round");
    currentRound++;
    if (currentRound < totalRounds) {
        loadRound();
        setTimeout(() => {
            audio.currentTime = 0;
            playWithFade();
        }, 750);
    } else {
        endGame();
    }
}

function endGame(){
  // Hide audio controls
  const audioControls = document.querySelector(".audio-controls");
  if (audioControls) audioControls.style.display = "none";
  
  // Hide instruction text
  const instructionText = document.querySelector(".instruction-text");
  if (instructionText) instructionText.style.display = "none";
  
  const cont = document.getElementById("choices");
  cont.style.display = "flex";
  cont.style.flexDirection = "column";
  cont.style.alignItems = "center";
  cont.style.justifyContent = "center";
  cont.style.padding = "30px 0";
  
  cont.innerHTML =
    `<div class="end-game" style="width:100%; text-align:center;">
       <p class="score-display">⭐ ${firstTryCorrect}/10 correct on the first try! ⭐</p>
       <div class="end-buttons">
         <button onclick="window.location.reload()" class="end-btn">New Round</button>
         <button onclick="location.href='index.html'" class="end-btn">Main Menu</button>
       </div>
     </div>`;
  document.getElementById("next-button").style.display = "none";
  document.getElementById("feedback").textContent = "";
}

document.getElementById("next-button").onclick = loadNextRound;

function goHome() {
    window.location.href = "/index.html";
}
document.addEventListener('DOMContentLoaded', () => {
    // Make sure the play button has both icon and text
    const playButton = document.getElementById('play-sound');
    if (playButton && playButton.innerHTML.trim() === '▶') {
        playButton.innerHTML = '<span class="play-icon">▶</span> Play Sound';
    }
    
    initAudio();
    loadCategoryData();
});