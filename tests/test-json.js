const fs = require('fs');
const path = require('path');

console.log('Testing problems.json loading...');

try {
    const problemsPath = path.join(__dirname, 'src', 'data', 'problems.json');
    console.log('Reading from:', problemsPath);
    
    const content = fs.readFileSync(problemsPath, 'utf8');
    console.log('File content length:', content.length);
    console.log('First 200 chars:', content.substring(0, 200));
    
    const data = JSON.parse(content);
    console.log('JSON parsed successfully!');
    console.log('Has problems array:', !!data.problems);
    console.log('Problems count:', data.problems ? data.problems.length : 0);
    console.log('First problem ID:', data.problems && data.problems[0] ? data.problems[0].id : 'NONE');
    
} catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
}
