const fs = require('fs');
const path = require('path');

// Define the paths
const wordsAudioDir = path.join(__dirname, 'audio', 'words');
const sfxAudioDir = path.join(__dirname, 'audio', 'sfx');
const wordOutputFile = path.join(__dirname, 'audio-files.js');
const sfxOutputFile = path.join(__dirname, 'sound-effects.js');

// Function to get MP3 files from a directory
function getMp3Files(dir) {
    return fs.readdirSync(dir)
        .filter(file => file.endsWith('.mp3'))
        .map(file => file.replace('.mp3', ''));
}

// Generate the word audio files list
try {
    const audioFiles = {
        'one-syllable': getMp3Files(path.join(wordsAudioDir, 'one-syllable')),
        'two-syllable': getMp3Files(path.join(wordsAudioDir, 'two-syllable')),
        'three-syllable': getMp3Files(path.join(wordsAudioDir, 'three-syllable'))
    };

    // Create the word files export statement
    const wordFileContent = `// This file is auto-generated. Do not edit manually.
export const audioFiles = ${JSON.stringify(audioFiles, null, 2)};
`;

    // Write the word files
    fs.writeFileSync(wordOutputFile, wordFileContent);
    console.log('Successfully generated audio-files.js');

    // Generate the sound effects list
    const sfxFiles = getMp3Files(sfxAudioDir)
        .map(file => {
            // Remove 'sfx-' prefix from filename to get the base ID
            const id = file.replace('sfx-', '');
            return {
                id,
                audioPath: `/audio/sfx/sfx-${id}.mp3`,
                imagePath: `/images/sfx/img-${id}.svg`
            };
        });

    // Create the sound effects export statement
    const sfxFileContent = `// This file is auto-generated. Do not edit manually.
export const soundEffects = {
    name: "Sound Effects",
    effects: ${JSON.stringify(sfxFiles, null, 2)}
};
`;

    // Write the sound effects file
    fs.writeFileSync(sfxOutputFile, sfxFileContent);
    console.log('Successfully generated sound-effects.js');

} catch (error) {
    console.error('Error generating audio files list:', error);
    process.exit(1);
}