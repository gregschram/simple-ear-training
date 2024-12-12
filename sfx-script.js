import { soundEffects } from './sound-effects.js';
let score = 0;
let attempts = 0;
let roundData = [];
let currentRound = 0;
const totalRounds = 10;
let firstTryCorrect = 0;
let attemptsInCurrentRound = 0;
let answerHistory = [];

const audio = new Audio();
audio.preload = "auto";

// Add fade in/out effect
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let source;
let gainNode;

function initAudio() {
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
}

function playWithFade() {
    if (source) {
        source.stop();
    }
    
    source = audioContext.createMediaElementSource(audio);
    source.connect(gainNode);
    
    // Reset gain and fade in
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.2);
    
    // Schedule fade out for end of audio
    audio.addEventListener('timeupdate', function() {
        if (audio.duration - audio.currentTime <= 0.2) {
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
        }
    });
    
    audio.play();
}

document.getElementById("home-button").onclick = () => {
    window.location.href = "/index.html";
};

document.getElementById("play-sound").onclick = () => {
    playWithFade();
};

async function loadCategoryData() {
    try {
        // Get effects from our generated data file
        roundData = soundEffects.effects.map(effect => ({
            audioPath: effect.audioPath,
            imagePath: effect.imagePath,
            name: effect.id
        }));
        
        // Randomize and slice to 10 rounds
        roundData = roundData.sort(() => 0.5 - Math.random()).slice(0, totalRounds);
        loadRound();
    } catch (error) {
        console.error("Error loading sound effects data:", error);
        alert("Failed to load the sound effects.");
        goHome();
    }
}

function loadRound() {
    attemptsInCurrentRound = 0;
    const round = roundData[currentRound];
    
    document.getElementById("feedback").textContent = "";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("round-tracker").textContent = `Round ${currentRound + 1}/${totalRounds}`;
    
    // Get 3 random different options for incorrect choices
    const otherOptions = roundData
        .filter(r => r !== round)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    
    // Combine correct option with random ones and shuffle
    const allOptions = [round, ...otherOptions]
        .sort(() => Math.random() - 0.5);
    
    // Create image grid
    const choicesContainer = document.getElementById("choices");
    choicesContainer.innerHTML = "";
    
    allOptions.forEach((option) => {
        const imageChoice = document.createElement("div");
        imageChoice.className = "image-choice";
        
        const img = document.createElement("img");
        img.src = option.imagePath;
        img.alt = option.name;
        
        imageChoice.appendChild(img);
        imageChoice.onclick = () => checkAnswer(imageChoice, option === round);
        choicesContainer.appendChild(imageChoice);
    });
    
    // Preload audio
    audio.src = round.audioPath;
    
    // Play initial sound after a short delay
    if (currentRound === 0) {
        setTimeout(() => playWithFade(), 750);
    }
}

function checkAnswer(element, isCorrect) {
    attemptsInCurrentRound++;
    if (isCorrect) {
        if (attemptsInCurrentRound === 1) {
            firstTryCorrect++;
            answerHistory[currentRound] = true;
        } else {
            answerHistory[currentRound] = false;
        }
        score++;
        element.classList.add("correct");
        document.getElementById("feedback").textContent = "Correct!";
        document.getElementById("feedback").className = "correct";
        document.getElementById("next-button").style.display = "inline-block";
        disableAllChoices();
        createCelebration();
    } else {
        element.classList.add("incorrect");
        element.style.pointerEvents = "none";
        document.getElementById("feedback").textContent = "Try again.";
        document.getElementById("feedback").className = "incorrect";
    }
}

// ... rest of the shared functions (createCelebration, showEndGame, etc.) remain the same ...

document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    loadCategoryData();
});