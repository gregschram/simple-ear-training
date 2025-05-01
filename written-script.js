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

// graceful fallback now that the button is an <a>
const homeBtn = document.getElementById('home-button') || document.querySelector('.back-link');
if (homeBtn) homeBtn.onclick = () => location.href = '/index.html';

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
           
            // Create round data using actual audio  
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
            
            loadRound();
        } else {
            let module = await import(`./spoken-sentence/${category}.js`);
            roundData = module[`${category}Exercises`].sentences;
            roundData = roundData.sort(() => 0.5 - Math.random()).slice(0, totalRounds);
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
        const audio = new Audio();
        
        audio.addEventListener('canplaythrough', () => {
            console.log(`Successfully loaded audio: ${path}`);  // Added debug log
            resolve(audio);
        }, { once: true });
        
        audio.addEventListener('error', (e) => {
            console.error(`Failed to load audio ${path}:`, e);  // Added debug log
            if (maxRetries > 0) {
                console.warn(`Retrying ${path}, ${maxRetries} attempts left`);
                setTimeout(() => loadAudioWithRetry(path, maxRetries - 1), 1000);
            } else {
                reject(new Error(`Failed to load audio: ${path}`));
            }
        }, { once: true });

        audio.src = path;
        audio.load(); // Explicitly trigger load
    });
}

// Update the createChoices function to handle the new layout
function loadRound() {
    attemptsInCurrentRound = 0;
    audio.playbackRate = audioSpeed;
    document.getElementById("toggle-speed").checked = isSlowSpeed;
    
    const round = roundData[currentRound];
    
    // Display the written sentence prompt
    document.getElementById("written-prompt").textContent = round.sentence;
    
    // Reset UI elements
    document.getElementById("feedback").textContent = "";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("round-tracker").textContent = `Round ${currentRound + 1}/${totalRounds}`;
    
    // Debug log
    console.log("Attempting to preload audio files for options");

    // Get 3 random different audio paths from roundData
    const otherOptions = roundData
        .filter(r => r !== round)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    
    // Combine correct option with random ones and shuffle
    const allOptions = [round, ...otherOptions]
        .sort(() => 0.5 - Math.random());

    // Create all audio preload promises
    const preloadPromises = allOptions.map(option => loadAudioWithRetry(option.audioPath));

    Promise.all(preloadPromises)
        .then(() => {
            console.log("All audio files loaded successfully");
            // Clear loading message
            document.getElementById("feedback").textContent = "";
            
            // Create choices after audio is loaded
            const choicesContainer = document.getElementById("choices");
            choicesContainer.innerHTML = "";
            choicesContainer.classList.add("choice-grid");  
            choicesContainer.classList.add("written-exercise");
            choicesContainer.classList.add("choice-grid");
            
            // Create audio-button pairs
            allOptions.forEach((option, index) => {
                const pairContainer = document.createElement("div");
                pairContainer.className = "audio-choice-pair";
    
                // Create play button
                const playButton = document.createElement("button");
                playButton.className = "play-audio-button";
                playButton.textContent = "▶";
                playButton.onclick = () => {
                    audio.src = option.audioPath;
                    audio.playbackRate = isSlowSpeed ? 0.65 : 1.0;
                    audio.play().catch(error => {
                        console.error("Play error for", option.audioPath, error);
                        document.getElementById("feedback").textContent = "Error playing audio. Please try again.";
                    });
                };
        
                // Create answer button
                const answerButton = document.createElement("button");
                answerButton.className = "choice";
                answerButton.textContent = `Choose Audio ${index + 1}`;
                answerButton.onclick = () => checkAnswer(answerButton, option === round, option);
    
                pairContainer.appendChild(playButton);
                pairContainer.appendChild(answerButton);
                choicesContainer.appendChild(pairContainer);
            });
        })
        .catch((error) => {
            console.error("Error preloading audio files:", error);
            document.getElementById("feedback").textContent = "Error loading audio. Please try again.";
        });
}

function checkAnswer(button, isCorrect, option) {
    attemptsInCurrentRound++;
    const feedback = document.getElementById("feedback");
    
    if (isCorrect) {
        button.classList.add("correct");
        feedback.textContent = "Correct! 🎉";
        score++;
    } else {
        button.classList.add("incorrect");
        feedback.textContent = "Incorrect. Try again! ❌";
        attempts++;
    }
    
    answerHistory.push({ option, isCorrect });
    if (attemptsInCurrentRound >= 3) {
        document.getElementById("next-button").style.display = "block";
    }
    
    console.log(answerHistory);
}

document.getElementById("next-button").onclick = () => {
    currentRound++;
    if (currentRound < totalRounds) {
        loadRound();
    } else {
        endGame();
    }
};

document.getElementById("toggle-speed").onchange = () => {
    isSlowSpeed = !isSlowSpeed;
    loadRound();
};

loadCategoryData(category);
