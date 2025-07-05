const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.use('/syofficial', express.static(path.join(__dirname, 'syofficial')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/syofficial', (req, res) => {
  res.sendFile(path.join(__dirname, 'syofficial', 'index.html'));
});

app.get('*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`SyOfficial is running on http://localhost:${PORT}/syofficial`);
}); 