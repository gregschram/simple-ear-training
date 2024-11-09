let score = 0;
let attempts = 0;
let audioSpeed = 1.0;
let roundData = [];
let currentRound = 0;
const totalRounds = 10;
let firstTryCorrect = 0;
let attemptsInCurrentRound = 0;
let answerHistory = []; 
let isSlowSpeed = false;  // Track checkbox state

const audio = new Audio();
audio.preload = "auto";
audio.playbackRate = audioSpeed;

document.getElementById("home-button").onclick = () => {
    window.location.href = "/index.html";
};

document.getElementById("play-sound").onclick = () => {
    audio.currentTime = 0;
    // Ensure correct speed before playing
    audio.playbackRate = audioSpeed;
    audio.play().catch(error => console.log("Audio play error:", error));
};

const urlParams = new URLSearchParams(window.location.search);
const exerciseType = urlParams.get('type');
const category = urlParams.get('category');

if (exerciseType === 'word') {
    document.getElementById("exercise-title").textContent = "Identify the Spoken Word";
    document.getElementById("category-title").style.display = 'none';
    document.querySelector(".instruction-text").textContent = "Press the word that matches what you hear. Press \"Play Sound\" to listen again.";
} else if (category) {
    document.getElementById("category-title").textContent = `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
}

//Instructions for Spoken Word game specifically
if (exerciseType === 'word') {
    document.getElementById("exercise-title").textContent = "Identify the Spoken Word";
    document.getElementById("category-title").style.display = 'none';
    document.querySelector(".instruction-text").textContent = "Press the word that matches what you hear. Press \"Play Sound\" to listen again.";
}

if (exerciseType === 'word') {
    document.querySelectorAll('.play-sound, .choice').forEach(button => {
        button.style.backgroundColor = '#7952b3';
    });
    
    // Update hover state via CSS
    const style = document.createElement('style');
    style.textContent = `
        .play-sound:hover, .choice:hover { background-color: #563d7c !important; }
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
            
            // Convert syllables parameter to folder name
            const folderName = syllables === 'all' ? 
                ['one-syllable', 'two-syllable', 'three-syllable'][Math.floor(Math.random() * 3)] : 
                `${syllables}-syllable`;
            
            // Create a data structure similar to sentence exercises
            let currentWords = wordBank.wordBanks[syllables === 'all' ? 
                folderName.split('-')[0] : syllables].words;
            
            // For this version, we'll use the word bank to simulate the available audio files
            // Later we can update this to match your actual audio files
            roundData = currentWords.map(word => ({
                audioPath: `/audio/words/${folderName}/${word}.mp3`,
                sentence: word,
                options: [
                    word,
                    ...currentWords
                        .filter(w => w !== word)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3)
                ]
            }));
            
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
    
    // Reset UI elements
    document.getElementById("feedback").textContent = "Loading audio...";
    document.getElementById("feedback").className = "";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("round-tracker").textContent = `Round ${currentRound + 1}/${totalRounds}`;
    
    // Debug log
    console.log("Attempting to load audio from path:", round.audioPath);

    // Preload audio for this round
    const preloadPromise = new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => {
            console.log(`Successfully loaded audio: ${round.audioPath}`);
            resolve();
        }, { once: true });
        
        audio.addEventListener('error', (e) => {
            console.error(`Failed to load audio ${round.audioPath}:`, e);
            reject(`Failed to load ${round.audioPath}`);
        }, { once: true });

        // Ensure path starts with leading slash
        audio.src = round.audioPath.startsWith('/') ? round.audioPath : `/${round.audioPath}`;
    });

    preloadPromise
        .then(() => {
            console.log("Audio file loaded successfully");
            document.getElementById("feedback").textContent = "";
            if (currentRound === 0) {
                setTimeout(() => audio.play(), 750);
            }
            
            // Create choices after audio is loaded
            const choicesContainer = document.getElementById("choices");
            choicesContainer.innerHTML = "";
            
            const shuffledOptions = [...round.options]
                .sort(() => Math.random() - 0.5);
            
            const correctIndex = shuffledOptions.indexOf(round.sentence);
            
            shuffledOptions.forEach((option, index) => {
                const button = document.createElement("button");
                button.textContent = option;
                button.className = "choice";
                button.onclick = () => checkAnswer(button, index === correctIndex);
                choicesContainer.appendChild(button);
            });
        })
        .catch(error => {
            console.error("Error in audio preload:", error);
            document.getElementById("feedback").textContent = "Error loading audio. Please try again.";
        });
}

function checkAnswer(button, isCorrect) {
    attemptsInCurrentRound++;
    if (isCorrect) {
        if (attemptsInCurrentRound === 1) {
            firstTryCorrect++;
            answerHistory[currentRound] = true;  // Mark as first try correct
        } else {
            answerHistory[currentRound] = false;  // Mark as eventually correct
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
        audio.currentTime = 0;
        setTimeout(() => audio.play(), 500);
    }
    // updateScoreDisplay();
}

function disableAllChoices() {
    document.querySelectorAll(".choice").forEach(button => {
        button.disabled = true;
    });
}

/* KEEPING IN CASE WE BRING BACK SCORE
function updateScoreDisplay() {
    const displayStars = answerHistory
        .slice(0, currentRound + 1)  // Only show stars for completed rounds
        .map(wasFirstTry => wasFirstTry ? "⭐" : "💫")
        .join("");
    document.getElementById("score").textContent = `Score: ${displayStars}`;
}
*/

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
        setTimeout(() => {
            audio.currentTime = 0;
            audio.playbackRate = isSlowSpeed ? 0.65 : 1.0;
            audio.play();
        }, 750);
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
    document.getElementById("play-sound").style.display = "none";
    document.getElementById("toggle-speed").style.display = "none";
    document.querySelector(".instruction-text").style.display = "none";
    document.querySelector(".speed-checkbox").style.display = "none";
}

document.getElementById("next-button").onclick = loadNextRound;

function goHome() {
    window.location.href = "/index.html";
}

document.addEventListener('DOMContentLoaded', () => {
    //updateScoreDisplay();
    loadCategoryData(category);
});
