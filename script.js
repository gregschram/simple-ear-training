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

function loadRound() {
    const round = roundData[currentRound];
    audio.src = round.audioPath;

    document.getElementById("feedback").textContent = "";
    document.getElementById("feedback").style.color = "";
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
        document.getElementById("feedback").style.color = "green";
        document.getElementById("next-button").style.display = "inline-block";
    } else {
        button.classList.add("incorrect");
        document.getElementById("feedback").textContent = "That's not quite it. Try again.";
        document.getElementById("feedback").style.color = "red";
        audio.currentTime = 0;
        audio.play();
    }
    document.getElementById("score").textContent = `Score: ${score}/${attempts}`;
}

document.getElementById("toggle-speed").onclick = () => {
    audioSpeed = audioSpeed === 1.0 ? 0.65 : 1.0;
    audio.playbackRate = audioSpeed;
    const speedText = audioSpeed === 1.0 ? 'Normal Speed' : 'Slow Speed';
    const icon = audioSpeed === 1.0 ? '⏵⏵' : '⏵';
    document.getElementById("toggle-speed").textContent = '';
    document.getElementById("toggle-speed").innerHTML = `<span class="icon">${icon}</span> ${speedText}`;
    document.getElementById("toggle-speed").classList.toggle("active");
};

function loadNextRound() {
    currentRound++;
    if (currentRound < roundData.length) {
        loadRound();
    } else {
        alert("Game over! Your score: " + score + "/" + totalRounds);
        goHome();
    }
}

loadCategoryData(category);
