window.goHome ||= () => location.href = 'index.html';

/*  SPOKEN EXERCISE  – full feature set, 2×2 grid  */
let score = 0;
let attempts = 0;
let audioSpeed = 1.0;
let roundData = [];
let currentRound = 0;
const totalRounds = 10;
let firstTryCorrect = 0;
let attemptsInCurrentRound = 0;
let answerHistory = [];
let isSlowSpeed = false;

const audio = new Audio();
audio.preload = "auto";
audio.playbackRate = audioSpeed;

function wireSpeedToggle(){
  const tgl = document.getElementById('toggle-speed');
  if(!tgl) return;
  tgl.onchange = () => {
    isSlowSpeed = tgl.checked;
    audioSpeed = isSlowSpeed ? 0.65 : 1.0;
    audio.playbackRate = audioSpeed;
    
    // Apply speed change to current audio if it's already loaded
    if (audio.src) {
      const wasPlaying = !audio.paused;
      const currentTime = audio.currentTime;
      audio.playbackRate = audioSpeed;
      if (wasPlaying) audio.play();
    }
  };
}
wireSpeedToggle();          // call once when the script loads


// graceful fallback now that the button is an <a>
const homeBtn = document.getElementById('home-button') || document.querySelector('.back-link');
if (homeBtn) homeBtn.onclick = () => location.href = '/index.html';


/*  NAV / UI  */
document.getElementById("play-sound").onclick = () => {
    audio.currentTime = 0;
    audio.playbackRate = audioSpeed;
    audio.play().catch(() => {});
};

const urlParams = new URLSearchParams(window.location.search);
const exerciseType = urlParams.get("type");        // "word" or null
const category = urlParams.get("category");        // e.g. "greetings"

/*  PAGE-SPECIFIC TITLES  */
if (exerciseType === "word") {
    document.getElementById("exercise-title").textContent = "Identify the Spoken Word";
    document.getElementById("category-title").style.display = "none";
    document.querySelector(".instruction-text").textContent =
        'Press the word that matches what you hear. Press "Play Sound" to listen again.';
} else if (category) {
    document.getElementById("category-title").textContent =
        `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
}

/*  ----------------  DATA LOADING  ----------------- */
async function loadCategoryData() {
    try {
        if (exerciseType === "word") {
            const syllables = urlParams.get("syllables");          // one|two|three|all
            const wordBank = (await import("./word-banks.js")).wordBanks;
            const audioFiles = (await import("./audio-files.js")).audioFiles;

            let availableWords;
            let getSyllableType;
            if (syllables === "all") {
                availableWords = [
                    ...audioFiles["one-syllable"].map(w => ({ word: w, type: "one" })),
                    ...audioFiles["two-syllable"].map(w => ({ word: w, type: "two" })),
                    ...audioFiles["three-syllable"].map(w => ({ word: w, type: "three" }))
                ];
                getSyllableType = w => availableWords.find(x => x.word === w)?.type;
            } else {
                const folder = `${syllables}-syllable`;
                availableWords = audioFiles[folder].map(w => ({ word: w, type: syllables }));
                getSyllableType = () => syllables;
            }

            roundData = availableWords.map(({ word, type }) => {
                const folder = `${type}-syllable`;
                const wrongPool = wordBank[type].words;
                return {
                    audioPath: `/audio/words/${folder}/${word}.mp3`,
                    sentence: word,
                    options: [
                        word,
                        ...wrongPool.filter(w => w !== word)
                            .sort(() => Math.random() - 0.5)
                            .slice(0, 3)
                    ]
                };
            })
                .sort(() => 0.5 - Math.random()).slice(0, totalRounds)
                .map(r => ({ ...r, options: r.options.sort(() => Math.random() - 0.5) }));

            loadRound();
        } else {
            const mod = await import(`./spoken-sentence/${category}.js`);
            roundData = mod[`${category}Exercises`].sentences
                .sort(() => 0.5 - Math.random()).slice(0, totalRounds);
            loadRound();
        }
    } catch (err) {
        console.error("Category load error:", err);
        alert("Failed to load the selected category.");
        goHome();
    }
}

/*  ----------  ROUND FLOW  ---------- */
function preloadNextRound() {
    if (currentRound + 1 >= totalRounds) return;
    const next = roundData[currentRound + 1];
    if (!next.audioPath) return;
    const a = new Audio(next.audioPath.startsWith("/") ? next.audioPath : `/${next.audioPath}`);
    a.preload = "auto";
}

function loadAudioWithRetry(path, retries = 3) {
    return new Promise((res, rej) => {
        const a = new Audio();
        a.addEventListener("canplaythrough", () => res(a), { once: true });
        a.addEventListener("error", () => retries ? setTimeout(() => res(loadAudioWithRetry(path, retries - 1)), 1000) : rej(), { once: true });
        a.src = path;
        a.load();
    });
}

function loadRound() {
    attemptsInCurrentRound = 0;
    audio.playbackRate = audioSpeed;

    const r = roundData[currentRound];
    document.getElementById("feedback").textContent = "Loading audio...";
    document.getElementById("feedback").className = "";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("next-button").classList.remove("visible");
    document.getElementById("round-tracker").textContent = `Round ${currentRound + 1}/${totalRounds}`;

    loadAudioWithRetry(r.audioPath).then(() => {
        document.getElementById("feedback").textContent = "";
        audio.src = r.audioPath;
        if (!currentRound) setTimeout(() => audio.play(), 750);

        const box = document.getElementById("choices");
        document.getElementById("feedback").style.minHeight = "24px";
        box.innerHTML = "";
        box.classList.add("choice-grid"); // 2×2 grid

        const shuffled = [...r.options].sort(() => Math.random() - 0.5);
        const correctIdx = shuffled.indexOf(r.sentence);

        shuffled.forEach((opt, i) => {
            const b = document.createElement("button");
            b.className = "choice";
            b.textContent = opt;
            b.onclick = () => checkAnswer(b, i === correctIdx);
            box.appendChild(b);
        });
    }).catch(() => {
        document.getElementById("feedback").textContent = "Error loading audio.";
    });

    setTimeout(preloadNextRound, 500);
}

/*  ----------  ANSWER CHECKING  ---------- */
function disableAllChoices() {
    document.querySelectorAll(".choice").forEach(b => b.disabled = true);
}
function createCelebration() { /* unchanged … */ }
function addSparkleEffect() { /* unchanged … */ }

function checkAnswer(btn, correct) {
    attemptsInCurrentRound++;
    if (correct) {
         // Add animation class
        if (window.animateButton) {
            window.animateButton(btn);
        }
        if (attemptsInCurrentRound === 1) {
            firstTryCorrect++;
            answerHistory[currentRound] = true;
        
        } else {
            answerHistory[currentRound] = false;
        }
        score++;
        btn.classList.add("correct");
        document.getElementById("feedback").textContent = "Correct!";
        document.getElementById("feedback").className = "correct";
        document.getElementById("feedback").style.marginBottom = "20px";
        document.getElementById("next-button").style.display = "block";
        document.getElementById("next-button").classList.add("visible");
        disableAllChoices();
        createCelebration();
    } else {
        btn.classList.add("incorrect");
        btn.disabled = true;
        document.getElementById("feedback").textContent = "That's not quite it. Try again.";
        document.getElementById("feedback").className = "incorrect";
    }
}



/*  ----------  ROUND NAV  ---------- */
function loadNextRound() {
    currentRound++;
    if (currentRound < totalRounds) {
        loadRound();
        setTimeout(() => { audio.currentTime = 0; audio.play(); }, 750);
    } else {
        endGame();
    }
}
document.getElementById("next-button").onclick = loadNextRound;

/*  ----------  END GAME  ---------- */
function endGame(){
  // Hide audio controls
  const audioControls = document.querySelector(".audio-controls");
  if (audioControls) audioControls.style.display = "none";
  
  // Hide instruction text
  const instructionText = document.querySelector(".instruction-text");
  if (instructionText) instructionText.style.display = "none";
  
  const cont = document.getElementById("choices");
  cont.style.display = "flex";
  cont.style.flexDirection = "column";
  cont.style.alignItems = "center";
  cont.style.justifyContent = "center";
  cont.style.padding = "30px 0";
  
  cont.innerHTML =
    `<div class="end-game" style="width:100%; text-align:center;">
       <p class="score-display">⭐ ${firstTryCorrect}/10 correct on the first try! ⭐</p>
       <div class="end-buttons">
         <button onclick="window.location.reload()" class="end-btn">New Round</button>
         <button onclick="location.href='index.html'" class="end-btn">Main Menu</button>
       </div>
     </div>`;
  document.getElementById("next-button").style.display = "none";
  document.getElementById("feedback").textContent = "";
}

/*  ----------  INIT  ---------- */
function goHome() {
    window.location.href = "/index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const playBtn = document.getElementById("play-sound");
    if (playBtn && playBtn.innerHTML.trim() === "▶") {
        playBtn.innerHTML = '<span class="play-icon">▶</span> Play Sound';
    }
    if (exerciseType === "word") loadCategoryData();
    else if (category) loadCategoryData();
    else {
        console.error("No exercise type or category");
        goHome();
    }
});
