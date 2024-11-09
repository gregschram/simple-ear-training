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
const category = urlParams.get('category');
document.getElementById("category-title").textContent = `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`;

async function loadCategoryData(category) {
    try {
        let module = await import(`./spoken-sentence/${category}.js`);
        roundData = module[`${category}Exercises`].sentences;
        roundData = roundData.sort(() => 0.5 - Math.random()).slice(0, totalRounds);
        loadRound();
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
    document.getElementById("feedback").textContent = "";
    document.getElementById("feedback").className = "";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("round-tracker").textContent = `Round ${currentRound + 1}/${totalRounds}`;
    
    // Create four audio-button pairs
    const choicesContainer = document.getElementById("choices");
    choicesContainer.innerHTML = "";
    
    // Get 3 random different audio paths from roundData
    const otherOptions = roundData
        .filter(r => r !== round)  // Exclude current round
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    
    // Combine correct option with random ones and shuffle
    const allOptions = [round, ...otherOptions]
        .sort(() => 0.5 - Math.random());
    
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
            audio.play().catch(error => console.log("Audio play error:", error));
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
            <p>⭐${firstTryCorrect}/10 correct on the first try! ⭐</p>
            <button onclick="window.location.reload()" class="choice">New Round</button>
            <button onclick="window.location.href='/index.html'" class="choice">Main Menu</button>
        </div>
    `;
    document.getElementById("feedback").textContent = "";
    document.getElementById("next-button").style.display = "none";
    document.querySelector(".instruction-text").style.display = "none";
    document.querySelector(".speed-checkbox").style.display = "none";
}

document.getElementById("next-button").onclick = loadNextRound;

function goHome() {
    window.location.href = "/index.html";
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    document.getElementById("category-title").textContent = `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    loadCategoryData(category);
});
