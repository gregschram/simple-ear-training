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

    // Preload all audio files for this round
    const preloadPromises = allOptions.map(option => {
        return new Promise((resolve, reject) => {
            const tempAudio = new Audio();
            
            tempAudio.addEventListener('canplaythrough', () => {
                console.log(`Successfully loaded audio: ${option.audioPath}`);
                resolve();
            }, { once: true });
            
            tempAudio.addEventListener('error', (e) => {
                console.error(`Failed to load audio ${option.audioPath}:`, e);
                reject(`Failed to load ${option.audioPath}`);
            }, { once: true });

            // Ensure path starts with leading slash
            tempAudio.src = option.audioPath.startsWith('/') ? option.audioPath : `/${option.audioPath}`;
        });
    });

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
    container.innerHTML = `
        <div class="end-game">
            <h2>Complete!</h2>
            <p>⭐ ${firstTryCorrect}/10 correct on the first try! ⭐</p>
            <button onclick="window.location.reload()" class="choice">New Round</button>
            <button onclick="window.location.href='/index.html'" class="choice">Main Menu</button>
        </div>
    `;
    document.getElementById("feedback").textContent = "";
    document.getElementById("next-button").style.display = "none";
    document.querySelector(".instruction-text").style.display = "none";
    document.querySelector(".speed-checkbox").style.display = "none";
    document.getElementById("written-prompt").style.display = "none";  // Add this line

}

document.getElementById("next-button").onclick = loadNextRound;

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
