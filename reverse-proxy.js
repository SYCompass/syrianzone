const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server
const proxy = httpProxy.createProxyServer();

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('Proxy error occurred');
});

// Create the main server
const server = http.createServer((req, res) => {
  const url = req.url;

  // Route /syriangit/* requests to syrian-contributors app on port 3001
  if (url.startsWith('/syriangit/') || url === '/syriangit') {
    // Rewrite the path to remove /syriangit prefix for the target app
    req.url = url.replace('/syriangit', '') || '/';
    proxy.web(req, res, { target: 'http://localhost:3001' });
  } else {
    // Route all other requests to poll app on port 3000
    proxy.web(req, res, { target: 'http://localhost:3000' });
  }
});

// Listen on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Reverse proxy server listening on port ${PORT}`);
  console.log('Routing:');
  console.log('  /syriangit/* -> http://localhost:3001');
  console.log('  /* -> http://localhost:3000');
});
