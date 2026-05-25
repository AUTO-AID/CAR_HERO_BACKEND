const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\a73d41ad-098c-4d46-a6aa-40abb39523dd\\.system_generated\\tasks\\task-3184.log';

if (!fs.existsSync(logPath)) {
  console.log('Log file not found at:', logPath);
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

// Find the last index of "Starting Nest application..."
let startIndex = 0;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('Starting Nest application...')) {
    startIndex = i;
    break;
  }
}

console.log(`Starting search from line ${startIndex} (last app startup)...`);
const errorBlocks = [];
let currentBlock = [];
let isCapturing = false;

for (let i = startIndex; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('ERROR') || line.includes('Exception') || line.includes('Error:') || line.includes('TypeError') || line.includes('MongoServerError') || line.includes('MongooseError')) {
    if (currentBlock.length > 0) {
      errorBlocks.push(currentBlock.join('\n'));
    }
    currentBlock = [line];
    isCapturing = true;
  } else if (isCapturing) {
    if (line.trim() === '' || (line.includes('[Nest]') && !line.includes('ERROR') && !line.includes('HttpExceptionFilter'))) {
      isCapturing = false;
      errorBlocks.push(currentBlock.join('\n'));
      currentBlock = [];
    } else {
      currentBlock.push(line);
    }
  }
}

if (currentBlock.length > 0) {
  errorBlocks.push(currentBlock.join('\n'));
}

console.log(`Found ${errorBlocks.length} error entries.`);
errorBlocks.forEach((block, idx) => {
  console.log(`\nError #${idx + 1}:\n${block}`);
});

if (currentBlock.length > 0) {
  errorBlocks.push(currentBlock.join('\n'));
}

console.log(`Found ${errorBlocks.length} error entries.`);
console.log('\n--- LAST 10 ERROR BLOCKS ---');
const lastTen = errorBlocks.slice(-10);
lastTen.forEach((block, idx) => {
  console.log(`\nError #${idx + 1}:\n${block}`);
});
