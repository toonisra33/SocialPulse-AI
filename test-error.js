const express = require('express');
const app = express();
app.use(express.json({ limit: '1b' }));
app.post('/', (req, res) => res.json({ ok: true }));
app.listen(3001, () => console.log('running'));
