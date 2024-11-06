let score = 0;
let attempts = 0;
let audioSpeed = 1.0;
let roundData = [];
let currentRound = 0;
const totalRounds = 10;

const audio = new Audio();
audio.playbackRate = audioSpeed;

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

// Load round and reset feedback
function loadRound() {
    const round = roundData[currentRound];
    audio.src = round.audioPath;

    document.getElementById("feedback").textContent = "";
    document.getElementById("next-button").style.display = "none";

    const choicesContainer = document.getElementById("choices");
    choicesContainer.innerHTML = "";

    document.getElementById("play-sound").onclick = () => {
        audio.currentTime = 0;
        audio.play();
    };

    round.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.textContent = option;
        button.className = "choice";
        button.onclick = () => checkAnswer(index);
        choicesContainer.appendChild(button);
    });
}

function checkAnswer(selectedIndex) {
    const round = roundData[currentRound];
    attempts++;

    if (round.options[selectedIndex] === round.sentence) {
        score++;
        document.getElementById("feedback").textContent = "Correct!";
    } else {
        document.getElementById("feedback").textContent = "Incorrect! Try listening again.";
        audio.currentTime = 0;
        audio.play();
    }
    
    document.getElementById("score").textContent = `Score: ${score}/${attempts}`;
    document.getElementById("next-button").style.display = "inline-block";
}

document.getElementById("toggle-speed").onclick = () => {
    audioSpeed = audioSpeed === 1.0 ? 0.65 : 1.0;
    audio.playbackRate = audioSpeed;
    document.getElementById("toggle-speed").textContent = audioSpeed === 1.0 ? 'Normal Speed' : 'Slow Speed';
    document.getElementById("toggle-speed").classList.toggle("active");
};

// Load the next round and increment the counter
function loadNextRound() {
    currentRound++;
    if (currentRound < roundData.length) {
        loadRound();
    } else {
        alert("Game over! Your score: " + score + "/" + totalRounds);
        goHome();
    }
}

// Start the game
loadCategoryData(category);
