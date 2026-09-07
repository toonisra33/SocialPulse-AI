import fs from 'fs';
const base64Audio = fs.readFileSync('test.mp3').toString('base64');
const html = `
<!DOCTYPE html>
<html>
<body>
  <audio controls src="data:audio/mp3;base64,${base64Audio}"></audio>
</body>
</html>
`;
fs.writeFileSync('test.html', html);
console.log('Saved test.html');
