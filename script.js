let score = 0;
let attempts = 0;
let audioSpeed = 1.0;
let roundData = [];
let currentRound = 0;
const totalRounds = 10;

// Get category from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category');

// Dynamically import the correct category data from the spoken-sentence folder
import { groceryExercises } from './spoken-sentence/grocery.js';

async function loadCategoryData(category) {
    try {
        console.log("Attempting to load category:", category); // Debugging line

        if (category === "grocery") {
            roundData = groceryExercises.sentences;
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



// Function to return to home page
function goHome() {
    window.location.href = "index.html";
}

// Function to load the current round
function loadRound() {
    if (currentRound >= roundData.length) {
        alert("Game over! Your score: " + score + "/" + totalRounds);
        goHome();
        return;
    }

    const round = roundData[currentRound];
    const choicesContainer = document.getElementById("choices");
    choicesContainer.innerHTML = "";

    const audio = new Audio(round.audioPath);
    audio.playbackRate = audioSpeed;

    document.getElementById("play-sound").onclick = () => {
        audio.currentTime = 0;
        audio.play();
    };

    document.getElementById("toggle-speed").onclick = () => {
        audioSpeed = audioSpeed === 1.0 ? 0.65 : 1.0;
        audio.playbackRate = audioSpeed;
        document.getElementById("toggle-speed").textContent = 
            audioSpeed === 1.0 ? 'Switch to Slow Speed' : 'Switch to Normal Speed';
    };

    round.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.textContent = option;
        button.className = "choice";
        button.onclick = () => checkAnswer(index);
        choicesContainer.appendChild(button);
    });
}

// Function to check the selected answer
function checkAnswer(selectedIndex) {
    const round = roundData[currentRound];
    attempts++;
    if (round.options[selectedIndex] === round.sentence) {
        score++;
        alert("Correct!");
    } else {
        alert("Incorrect!");
    }
    currentRound++;
    document.getElementById("score").textContent = `Score: ${score}/${attempts}`;
    loadRound();
}

// Load category data and start the first round
loadCategoryData(category);
