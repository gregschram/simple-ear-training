let score = 0;
let attempts = 0;
let audioSpeed = 1.0;

document.getElementById('play-sound').addEventListener('click', () => {
    const audio = new Audio('audio/sample.mp3');
    audio.playbackRate = audioSpeed;
    audio.play().catch(error => console.error("Audio play error:", error));
});

document.getElementById('toggle-speed').addEventListener('click', () => {
    audioSpeed = audioSpeed === 1.0 ? 0.75 : 1.0;
    document.getElementById('toggle-speed').textContent = 
        audioSpeed === 1.0 ? 'Switch to Slow Speed' : 'Switch to Normal Speed';
});

document.querySelectorAll('.choice').forEach(button => {
    button.addEventListener('click', () => {
        attempts++;
        // Replace with actual logic for correct answer
        if (button.textContent === "Cat") score++;  // Assuming "Cat" is the correct answer for now
        document.getElementById('score').textContent = `Score: ${score}/${attempts}`;
    });
});
