const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const NEXT_PORT = process.env.NEXT_PORT || 4000;

app.use(express.static(path.join(__dirname)));

app.use('/syofficial', express.static(path.join(__dirname, 'syofficial')));

// Proxy Next.js poll app under /tierlist and API/WebSocket under /api
const pollProxy = createProxyMiddleware({
  target: `http://localhost:${NEXT_PORT}`,
  changeOrigin: true,
  ws: true,
  // Do not rewrite paths. Next.js is configured with basePath "/tierlist".
});

app.use('/tierlist', pollProxy);
app.use('/api', pollProxy);

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

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`SyOfficial is running on http://localhost:${PORT}/syofficial`);
  console.log(`Tierlist (proxy) is available at http://localhost:${PORT}/tierlist`);
});

// Support WebSocket upgrades for proxied endpoints (e.g., /api/ws)
server.on('upgrade', (req, socket, head) => {
  try {
    const url = req.url || '';
    if (url.startsWith('/tierlist') || url.startsWith('/api')) {
      pollProxy.upgrade(req, socket, head);
    }
  } catch (err) {
    socket.destroy();
  }
});