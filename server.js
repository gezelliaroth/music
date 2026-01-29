const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 49152 + Math.floor(Math.random() * 16384);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>music</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    input {
      background: #222;
      color: #fff;
      border: 1px solid #444;
      padding: 0.5rem 1rem;
      font-size: 1.2rem;
      width: 200px;
      text-align: center;
      outline: none;
      font-family: monospace;
    }
    input::placeholder {
      color: #666;
    }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type=number] {
      -moz-appearance: textfield;
    }
    #controls {
      display: flex;
      gap: 0.5rem;
    }
    button {
      background: #333;
      color: #fff;
      border: 1px solid #444;
      padding: 0.5rem 1rem;
      font-size: 1.2rem;
      font-family: monospace;
      cursor: pointer;
    }
    button:hover {
      background: #444;
    }
  </style>
</head>
<body>
  <div id="controls">
    <input id="port" type="number" placeholder="Port" autofocus>
    <button id="connect">Stream</button>
  </div>
  <audio id="voiceAudio"></audio>
  <audio id="musicAudio"></audio>
  <script>
    const input = document.getElementById("port");
    const btn = document.getElementById("connect");
    const controls = document.getElementById("controls");
    const voiceAudio = document.getElementById("voiceAudio");
    const musicAudio = document.getElementById("musicAudio");
    function connectStream() {
      const val = input.value.trim();
      if (!val) return;
      const port = parseInt(val, 10);
      if (port < 1 || port > 65535) return;

      controls.style.display = "none";

      voiceAudio.src = "/proxy/" + port + "/voice";
      musicAudio.src = "/proxy/" + port + "/music";
      musicAudio.volume = 0.5;

      voiceAudio.load();
      musicAudio.load();
      voiceAudio.play();
      musicAudio.play();
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") connectStream();
    });
    btn.addEventListener("click", connectStream);
  </script>
</body>
</html>`;

const logoPath = path.join(__dirname, "resources", "logo.png");

const server = http.createServer((req, res) => {
  const proxyMatch = req.url.match(/^\/proxy\/(\d+)\/(\w+)$/);
  if (proxyMatch) {
    const targetPort = parseInt(proxyMatch[1], 10);
    const endpoint = proxyMatch[2];
    const proxyReq = http.get(`http://localhost:${targetPort}/${endpoint}`, (proxyRes) => {
      res.writeHead(200, {
        "Content-Type": proxyRes.headers["content-type"] || "audio/wav",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
        "Access-Control-Allow-Origin": "*",
      });
      proxyRes.pipe(res);
    });
    proxyReq.on("error", () => {
      res.writeHead(502);
      res.end();
    });
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  }
});

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
