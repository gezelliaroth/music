const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 49152 + Math.floor(Math.random() * 16384);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Music Player</title>
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
  </style>
</head>
<body>
  <audio id="audio" autoplay loop src="/song.mp3"></audio>
  <script>
    const audio = document.getElementById("audio");
    audio.play().catch(() => {
      document.addEventListener("click", () => audio.play(), { once: true });
    });
  </script>
</body>
</html>`;

const songPath = path.join(__dirname, "resources", "song.mp3");
const logoPath = path.join(__dirname, "resources", "logo.png");

const server = http.createServer((req, res) => {
  if (req.url === "/song.mp3") {
    const stat = fs.statSync(songPath);
    res.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": stat.size,
    });
    fs.createReadStream(songPath).pipe(res);
  } else if (req.url === "/logo.png") {
    const stat = fs.statSync(logoPath);
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": stat.size,
    });
    fs.createReadStream(logoPath).pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  }
});

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
