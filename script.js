let score = 0;
let attempts = 0;
let audioSpeed = 1.0;
let roundData = [];
let currentRound = 0;
const totalRounds = 10;

const audio = new Audio();
audio.preload = "auto";
audio.playbackRate = audioSpeed;

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
    const round = roundData[currentRound];
    audio.src = round.audioPath;
    console.log("Audio source set to:", audio.src); // Log audio path for debugging

    document.getElementById("feedback").textContent = "";
    document.getElementById("feedback").className = "";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("round-tracker").textContent = `Round ${currentRound + 1}/${totalRounds}`;
    
    const choicesContainer = document.getElementById("choices");
    choicesContainer.innerHTML = "";

    round.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.textContent = option;
        button.className = "choice";
        button.onclick = () => checkAnswer(button, index);
        choicesContainer.appendChild(button);
    });
}

function checkAnswer(button, selectedIndex) {
    const round = roundData[currentRound];
    if (round.options[selectedIndex] === round.sentence) {
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
        audio.play();
    }
    updateScoreDisplay();
}

function disableAllChoices() {
    document.querySelectorAll(".choice").forEach(button => {
        button.disabled = true;
    });
}

function updateScoreDisplay() {
    const stars = "⭐".repeat(score);
    document.getElementById("score").textContent = `Score: ${stars}`;
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
    console.log("Loading the next round"); // This will log to the console when the function is triggered
    currentRound++;
    if (currentRound < roundData.length) {
        loadRound();
    } else {
        alert("Exercise completed! Your final score: " + score + " out of " + totalRounds);
        goHome();
    }
}

function goHome() {
    console.log("Navigating to the home page"); // This will log to the console when the function is triggered
    window.location.href = "index.html";
}

// Initial call to load category data
loadCategoryData(category);
