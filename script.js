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

    // Reset feedback and next button for the new round
    document.getElementById("feedback").textContent = "";
    document.getElementById("feedback").style.color = "";
    document.getElementById("feedback").style.fontSize = "1.5em";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("round-tracker").textContent = `Round ${currentRound + 1}/${totalRounds}`;
    
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
        button.onclick = () => checkAnswer(button, index);
        button.onmouseover = () => button.style.backgroundColor = "#555";  // Hover effect
        button.onmouseout = () => button.style.backgroundColor = "#3a3a3a"; // Reset hover
        choicesContainer.appendChild(button);
    });
}

function checkAnswer(button, selectedIndex) {
    const round = roundData[currentRound];
    attempts++;

    if (round.options[selectedIndex] === round.sentence) {
        score++;
        button.classList.add("correct");
        document.getElementById("feedback").textContent = "Correct!";
        document.getElementById("feedback").style.color = "#7fff7f"; // Lighter green for correct
        document.getElementById("next-button").style.display = "inline-block";
        disableAllChoices(); // Disable choices after correct answer
    } else {
        button.classList.add("incorrect");
        button.disabled = true; // Disable only the incorrect button
        document.getElementById("feedback").textContent = "That's not quite it. Try again.";
        document.getElementById("feedback").style.color = "#ff7f7f"; // Lighter red for incorrect
        audio.currentTime = 0;
        audio.play();
    }
    updateScoreDisplay(); // Use the star-based score display
}

// Disable all choices after a correct answer is selected
function disableAllChoices() {
    document.querySelectorAll(".choice").forEach(button => {
        button.disabled = true;
    });
}

// Update the score display with stars
function updateScoreDisplay() {
    const stars = "⭐".repeat(score) + "☆".repeat(totalRounds - score);
    document.getElementById("score").textContent = `Score: ${stars}`;
}

// Toggle audio speed with icons
document.getElementById("toggle-speed").onclick = () => {
    audioSpeed = audioSpeed === 1.0 ? 0.65 : 1.0;
    audio.playbackRate = audioSpeed;
    const speedText = audioSpeed === 1.0 ? 'Normal Speed' : 'Slow Speed';
    const icon = audioSpeed === 1.0 ? '⏵⏵' : '⏵';
    document.getElementById("toggle-speed").textContent = '';
    document.getElementById("toggle-speed").innerHTML = `<span class="icon">${icon}</span> ${speedText}`;
    document.getElementById("toggle-speed").classList.toggle("active");
};

// Load the next round
function loadNextRound() {
    currentRound++;
    if (currentRound < roundData.length) {
        loadRound();
    } else {
        alert("Exercise completed! Your final score: " + score + " out of " + totalRounds);
        goHome();
    }
}

// Redirect to home page
function goHome() {
    window.location.href = "index.html";
}

// Initial call to load category data
loadCategoryData(category);
