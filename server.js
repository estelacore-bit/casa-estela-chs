const http = require("http");
const fs = require("fs");
const path = require("path");

const DATA_FILE = "data.json";

let records = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    records = JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {
    records = [];
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
}

const server = http.createServer((req, res) => {

  // ADD DATA
  if (req.method === "POST" && req.url === "/add") {
    let body = "";

    req.on("data", chunk => body += chunk);

    req.on("end", () => {
      const entry = JSON.parse(body);

      if (records.find(r => r.serial === entry.serial)) {
        res.writeHead(200, {"Content-Type":"application/json"});
        return res.end(JSON.stringify({ error: "Duplicate Serial" }));
      }

      records.push(entry);
      saveData();

      res.writeHead(200, {"Content-Type":"application/json"});
      res.end(JSON.stringify({ success: true }));
    });

    return;
  }

  // GET DATA
  if (req.method === "GET" && req.url === "/data") {
    res.writeHead(200, {"Content-Type":"application/json"});
    return res.end(JSON.stringify(records));
  }

  // DASHBOARD
  if (req.method === "GET" && req.url === "/dashboard") {

    let summary = {};

    records.forEach(r => {
      if (!summary[r.wing]) {
        summary[r.wing] = {
          newTube: 0,
          newSurface: 0,
          oldTube: 0,
          oldSurface: 0,
          working: 0,
          nonworking: 0
        };
      }

      if (r.newType === "Tube") summary[r.wing].newTube++;
      if (r.newType === "Surface") summary[r.wing].newSurface++;

      if (r.oldType === "Tube")
        summary[r.wing].oldTube += Number(r.working || 0) + Number(r.nonworking || 0);

      if (r.oldType === "Surface")
        summary[r.wing].oldSurface += Number(r.working || 0) + Number(r.nonworking || 0);

      summary[r.wing].working += Number(r.working || 0);
      summary[r.wing].nonworking += Number(r.nonworking || 0);
    });

    res.writeHead(200, {"Content-Type":"application/json"});
    return res.end(JSON.stringify(summary));
  }

  // STATIC FILES
  let filePath = "./public" + (req.url === "/" ? "/index.html" : req.url);
  let ext = path.extname(filePath);

  let contentType = "text/html";
  if (ext === ".css") contentType = "text/css";
  if (ext === ".js") contentType = "application/javascript";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not Found");
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});