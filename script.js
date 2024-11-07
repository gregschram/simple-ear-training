let score = 0;
let attempts = 0;
let audioSpeed = 1.0;
let roundData = [];
let currentRound = 0;
const totalRounds = 10;
let firstTryCorrect = 0;  // Track perfect answers
let attemptsInCurrentRound = 0;  // Track attempts per round
updateScoreDisplay(); // Add initial score display


const audio = new Audio();
audio.preload = "auto";
audio.playbackRate = audioSpeed;

// Add home button listener here
document.getElementById("home-button").onclick = () => {
    window.location.href = "/index.html";
};

// Play sound function
document.getElementById("play-sound").onclick = () => {
    audio.currentTime = 0;
    audio.play().catch(error => console.log("Audio play error:", error));
};

// Get category from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category');
document.getElementById("category-title").textContent = `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`;

async function loadCategoryData(category) {
    try {
        let module;
        if (category === "grocery") {
            module = await import('./spoken-sentence/grocery.js');
            roundData = module.groceryExercises.sentences;
        } else {
            alert("Category not found. Returning to home page.");
            goHome();
            return;
        }

        roundData = roundData.sort(() => 0.5 - Math.random()).slice(0, totalRounds);
        loadRound();
    } catch (error) {
        console.error("Error loading category data:", error);
        alert("Failed to load the selected category.");
        goHome();
    }
}

function loadRound() {
    attemptsInCurrentRound = 0;  // Reset attempts for new round
    updateScoreDisplay(); // Add this to ensure score display is updated when round loads
    
    const round = roundData[currentRound];
    const paddedId = round.id.toString().padStart(2, '0');
    
    attemptsInCurrentRound = 0;  // Reset attempts for new round
    
    audio.src = `/audio/grocery/grocery-${paddedId}.mp3`;
    console.log("Attempting to load audio from:", audio.src);
    
    audio.onloadeddata = () => {
        console.log("Audio loaded successfully");
        if (currentRound === 0) {
            setTimeout(() => audio.play(), 1000);
        }
    };

    // Reset UI elements
    document.getElementById("feedback").textContent = "";
    document.getElementById("feedback").className = "";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("round-tracker").textContent = `Round ${currentRound + 1}/${totalRounds}`;
    
    // Set up choices with randomization
    const choicesContainer = document.getElementById("choices");
    choicesContainer.innerHTML = "";
    
    // Randomize options
    const shuffledOptions = [...round.options]
        .sort(() => Math.random() - 0.5);
    
    // Store correct answer index for checking
    const correctIndex = shuffledOptions.indexOf(round.sentence);
    
    shuffledOptions.forEach((option, index) => {
        const button = document.createElement("button");
        button.textContent = option;
        button.className = "choice";
        button.onclick = () => checkAnswer(button, index === correctIndex);
        choicesContainer.appendChild(button);
    });
}

function checkAnswer(button, isCorrect) {
    attemptsInCurrentRound++;
    if (isCorrect) {
        if (attemptsInCurrentRound === 1) {
            firstTryCorrect++;
        }
        score++; // Add this line to increment total score
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
    updateScoreDisplay();
}
function disableAllChoices() {
    document.querySelectorAll(".choice").forEach(button => {
        button.disabled = true;
    });
}

function updateScoreDisplay() {
    const perfectStars = "⭐".repeat(firstTryCorrect);
    const partialStars = "💫".repeat(score - firstTryCorrect);  // Empty stars for eventual correct answers
    document.getElementById("score").textContent = `Score: ${perfectStars}${partialStars}`;
}

document.getElementById("toggle-speed").onclick = () => {
    audioSpeed = audioSpeed === 1.0 ? 0.65 : 1.0;
    audio.playbackRate = audioSpeed;
    const speedText = audioSpeed === 1.0 ? 'Normal Speed' : 'Slow Speed';
    const icon = audioSpeed === 1.0 ? '⏵⏵' : '⏵';
    document.getElementById("toggle-speed").innerHTML = `<span class="icon">${icon}</span> ${speedText}`;
    document.getElementById("toggle-speed").classList.toggle("active");
};

function loadNextRound() {
    console.log("Loading the next round");
    currentRound++;
    if (currentRound < totalRounds) {
        loadRound();
        // Add 0.75s delay for next round autoplay
        setTimeout(() => {
            audio.currentTime = 0;
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
            <h2>Exercise Complete!</h2>
            <p>Your score: ${firstTryCorrect}/10 correct on first try</p>
            <p>Total correct: ${score}/10</p>
            <button onclick="window.location.reload()" class="choice">New Round</button>
            <button onclick="window.location.href='/index.html'" class="choice">Home</button>
        </div>
    `;
    document.getElementById("feedback").textContent = "";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("play-sound").style.display = "none";
    document.getElementById("toggle-speed").style.display = "none";
}
// Connect Next button
document.getElementById("next-button").onclick = loadNextRound;

function goHome() {
    window.location.href = "/index.html";
}

// Initial call to load category data
loadCategoryData(category);
