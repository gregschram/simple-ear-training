let score = 0;
let attempts = 0;
let audioSpeed = 1.0;
let roundData = [];
let currentRound = 0;
const totalRounds = 10;

// Get category from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category');

// Dynamically import the correct category data
async function loadCategoryData(category) {
    try {
        let module;
        if (category === "grocery") {
            module = await import('./categories/grocery.js');
            roundData = module.groceryExercises.sentences;
//       HAVE THIS DISABLED UNTIL READY     
//        } else if (category === "doctor") {
//            module = await import('./categories/doctor.js');
//            roundData = module.doctorExercises.sentences;
        } else {
            alert("Category not found. Returning to home page.");
            goHome();
            return;
        }
        roundData = roundData.sort(() => 0.5 - Math.random()).slice(0, totalRounds);
        loadRound();
    } catch (error) {
        console.error("Error loading category data:", error);
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
