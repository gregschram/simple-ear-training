const fs = require('fs');
const path = require('path');

// Define the paths
const audioDir = path.join(__dirname, 'audio', 'words');
const outputFile = path.join(__dirname, 'audio-files.js');

// Function to get MP3 files from a directory
function getMp3Files(dir) {
    return fs.readdirSync(dir)
        .filter(file => file.endsWith('.mp3'))
        .map(file => file.replace('.mp3', ''));
}

// Generate the audio files list
try {
    const audioFiles = {
        'one-syllable': getMp3Files(path.join(audioDir, 'one-syllable')),
        'two-syllable': getMp3Files(path.join(audioDir, 'two-syllable')),
        'three-syllable': getMp3Files(path.join(audioDir, 'three-syllable'))
    };

    // Create the export statement
    const fileContent = `// This file is auto-generated. Do not edit manually.
export const audioFiles = ${JSON.stringify(audioFiles, null, 2)};
`;

    // Write the file
    fs.writeFileSync(outputFile, fileContent);
    console.log('Successfully generated audio-files.js');
} catch (error) {
    console.error('Error generating audio files list:', error);
    process.exit(1);
}
