let score = 0;
let attempts = 0;
let audioSpeed = 1.0;
let isSlowSpeed = false;
let roundData = [];
let currentRound = 0;
const totalRounds = 10;
let firstTryCorrect = 0;
let attemptsInCurrentRound = 0;
let answerHistory = [];

const audio = new Audio();
audio.preload = "auto";
audio.playbackRate = audioSpeed;

document.getElementById("home-button").onclick = () => {
    window.location.href = "/index.html";
};

const urlParams = new URLSearchParams(window.location.search);
const exerciseType = urlParams.get('type');
const category = urlParams.get('category');

// Instructions for Written Word game
if (exerciseType === 'word') {
    document.getElementById("exercise-title").textContent = "Identify the Written Word";
    document.getElementById("category-title").style.display = 'none';
    document.querySelector(".instruction-text").textContent = "Play each audio clip ▶️, then pick the clip that matches the word below.";
} else if (category) {
    document.getElementById("category-title").textContent = `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
}

if (exerciseType === 'word') {
    document.querySelectorAll('.play-audio-button, .choice').forEach(button => {
        button.style.backgroundColor = '#7952b3';
    });
    
    // Update hover state via CSS
    const style = document.createElement('style');
    style.textContent = `
        .play-audio-button:hover, .choice:hover { background-color: #563d7c !important; }
        .choice.correct { background-color: #4CAF50 !important; }
        .choice.incorrect { background-color: #F44336 !important; }
    `;
    document.head.appendChild(style);
}

async function loadCategoryData(category) {
    try {
        if (exerciseType === 'word') {
            const syllables = urlParams.get('syllables');
            let wordBank = await import('./word-banks.js');
            let audioFilesList = await import('./audio-files.js');
            
            let availableWords;
            let getSyllableType;

            if (syllables === 'all') {
                // Combine all syllable types, but keep track of which type each word is
                availableWords = [
                    ...audioFilesList.audioFiles['one-syllable'].map(word => ({ word, type: 'one' })),
                    ...audioFilesList.audioFiles['two-syllable'].map(word => ({ word, type: 'two' })),
                    ...audioFilesList.audioFiles['three-syllable'].map(word => ({ word, type: 'three' }))
                ];
                getSyllableType = (word) => availableWords.find(w => w.word === word)?.type;
            } else {
                const folderName = `${syllables}-syllable`;
                availableWords = audioFilesList.audioFiles[folderName].map(word => ({ word, type: syllables }));
                getSyllableType = () => syllables;
            }

            // Create round data using actual audio files
            roundData = availableWords.map(({ word, type }) => {
                const folderName = `${type}-syllable`;
                // Get wrong answers from the same syllable type
                const wrongAnswerPool = wordBank.wordBanks[type].words;

                return {
                    audioPath: `/audio/words/${folderName}/${word}.mp3`,
                    sentence: word,
                    options: [
                        word,
                        ...wrongAnswerPool
                            .filter(w => w !== word)
                            .sort(() => Math.random() - 0.5)
                            .slice(0, 3)
                    ]
                };
            });
            
            // Randomize and take 10 rounds
            roundData = roundData.sort(() => 0.5 - Math.random()).slice(0, totalRounds);
            // Randomize options for each round
            roundData.forEach(round => {
                round.options = round.options.sort(() => Math.random() - 0.5);
            });
            
            audio.play().catch(() => {}); // Add here for word exercises
            loadRound();
        } else {
            let module = await import(`./spoken-sentence/${category}.js`);
            roundData = module[`${category}Exercises`].sentences;
            roundData = roundData.sort(() => 0.5 - Math.random()).slice(0, totalRounds);
            audio.play().catch(() => {}); // Add here for word exercises
            loadRound();
        }
    } catch (error) {
        console.error("Error loading category data:", error);
        alert("Failed to load the selected category.");
        goHome();
    }
}

function preloadNextRound() {
    try {
        if (currentRound + 1 < totalRounds) {
            const nextRound = roundData[currentRound + 1];
            
            // Only preload the main audio for the next round
            if (nextRound && nextRound.audioPath) {
                console.log('Preloading next audio:', nextRound.audioPath);
                const audioToPreload = new Audio();
                audioToPreload.preload = "auto";
                
                // Add error handling
                audioToPreload.onerror = () => {
                    console.log('Failed to preload:', nextRound.audioPath);
                };
                
                audioToPreload.src = nextRound.audioPath.startsWith('/') ? 
                    nextRound.audioPath : `/${nextRound.audioPath}`;
            }
            
            // Remove the option preloading for now
            // We can add it back later if needed
        }
    } catch (error) {
        // Silently fail preloading - don't disrupt the game
        console.log('Preload failed:', error);
    }
}

function loadAudioWithRetry(path, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    function tryLoad(attempt = 1) {
      const audio = new Audio();
      
      audio.addEventListener('loadeddata', () => {
        resolve(audio);
      }, { once: true });
      
      audio.addEventListener('error', (e) => {
        console.warn(`Attempt ${attempt} failed for ${path}`, e);
        if (attempt < maxRetries) {
          setTimeout(() => tryLoad(attempt + 1), 1000 * attempt);
        } else {
          reject(new Error(`Failed to load after ${maxRetries} attempts: ${path}`));
        }
      }, { once: true });

      // Force no range requests
      audio.preload = 'auto';
      audio.src = path;
    }

    tryLoad();
  });
}

function loadRound() {
    attemptsInCurrentRound = 0;
    audio.playbackRate = audioSpeed;
    document.getElementById("toggle-speed").checked = isSlowSpeed;
    
    const round = roundData[currentRound];
    
    // Display the written sentence prompt
    document.getElementById("written-prompt").textContent = round.sentence;
    
    // Reset UI elements
    document.getElementById("feedback").textContent = "Loading audio...";
    document.getElementById("feedback").className = "";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("round-tracker").textContent = `Round ${currentRound + 1}/${totalRounds}`;
    
    // Get 3 random different audio paths from roundData
    const otherOptions = roundData
        .filter(r => r !== round)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    
    // Combine correct option with random ones and shuffle
    const allOptions = [round, ...otherOptions]
        .sort(() => 0.5 - Math.random());

    // Debug log
    console.log("Attempting to preload audio files for paths:", allOptions.map(opt => opt.audioPath));

    // Create all audio preload promises
    const preloadPromises = allOptions.map(option => loadAudioWithRetry(option.audioPath));

    Promise.all(preloadPromises)
        .then(() => {
            console.log("All audio files loaded successfully");
            // Clear loading message
            document.getElementById("feedback").textContent = "";
            
            // Create four audio-button pairs
            const choicesContainer = document.getElementById("choices");
            choicesContainer.innerHTML = "";
            
            // Create audio-button pairs
            allOptions.forEach((option, index) => {
                const pairContainer = document.createElement("div");
                pairContainer.className = "audio-choice-pair";
                
                // Create play button
                const playButton = document.createElement("button");
                playButton.className = "play-audio-button";
                playButton.textContent = "▶";
                playButton.onclick = () => {
                    audio.src = option.audioPath.startsWith('/') ? option.audioPath : `/${option.audioPath}`;
                    audio.playbackRate = isSlowSpeed ? 0.65 : 1.0;
                    audio.play().catch(error => {
                        console.error("Play error for", option.audioPath, error);
                        document.getElementById("feedback").textContent = "Error playing audio. Please try again.";
                    });
                };
                
                // Create answer button
                const answerButton = document.createElement("button");
                answerButton.className = "choice";
                answerButton.textContent = `Audio ${index + 1}`;
                answerButton.onclick = () => checkAnswer(answerButton, option === round);
                
                pairContainer.appendChild(playButton);
                pairContainer.appendChild(answerButton);
                choicesContainer.appendChild(pairContainer);
            });
        })
        .catch(error => {
            console.error("Error in audio preload:", error);
            document.getElementById("feedback").textContent = "Error loading audio files. Please reload the page.";
        });
    setTimeout(() => preloadNextRound(), 500);
}

function checkAnswer(button, isCorrect) {
    attemptsInCurrentRound++;
    if (isCorrect) {
        if (attemptsInCurrentRound === 1) {
            firstTryCorrect++;
            answerHistory[currentRound] = true;
        } else {
            answerHistory[currentRound] = false;
        }
        score++;
        button.classList.add("correct");
        document.getElementById("feedback").textContent = "Correct!";
        document.getElementById("feedback").className = "correct";
        document.getElementById("next-button").style.display = "inline-block";
        disableAllChoices();
        createCelebration();  // Add celebration here
    } else {
        button.classList.add("incorrect");
        button.disabled = true;
        document.getElementById("feedback").textContent = "That's not quite it. Try again.";
        document.getElementById("feedback").className = "incorrect";
    }
}

function disableAllChoices() {
    document.querySelectorAll(".choice").forEach(button => {
        button.disabled = true;
    });
}

document.getElementById("toggle-speed").onchange = (e) => {
    isSlowSpeed = e.target.checked;
    audioSpeed = isSlowSpeed ? 0.65 : 1.0;
    audio.playbackRate = audioSpeed;
};

function loadNextRound() {
    console.log("Loading the next round");
    currentRound++;
    if (currentRound < totalRounds) {
        loadRound();
    } else {
        showEndGame();
    }
}

function showEndGame() {
    const container = document.getElementById("choices");
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        container.innerHTML = `
            <div class="end-game">
                <h2>Complete!</h2>
                <p>⭐ ${firstTryCorrect}/10 correct on the first try! ⭐</p>
                <button onclick="window.location.reload()" class="choice">New Round</button>
                <button onclick="window.location.href='/index.html'" class="choice">Main Menu</button>
            </div>
        `;
        
        const endGameDiv = container.querySelector('.end-game');
        addSparkleEffect(endGameDiv);
        
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
        container.style.transition = 'opacity 0.3s, transform 0.3s';
    }, 300);

    document.getElementById("feedback").textContent = "";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("play-sound").style.display = "none";
    document.getElementById("toggle-speed").style.display = "none";
    document.querySelector(".instruction-text").style.display = "none";
    document.querySelector(".speed-checkbox").style.display = "none";
}

document.getElementById("next-button").onclick = loadNextRound;

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
function goHome() {
    window.location.href = "/index.html";
}

document.addEventListener('DOMContentLoaded', () => {
    if (exerciseType === 'word') {
        loadCategoryData();  // No category needed for word exercises
    } else if (category) {
        loadCategoryData(category);
    } else {
        console.error("No valid exercise type or category specified");
        goHome();
    }
});
