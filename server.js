const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "public");
const defaultPort = Number(process.env.PORT || 3000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".m4v": "video/mp4",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function setCommonHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
}

function setCacheHeaders(response, filePath) {
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/");
  const ext = path.extname(filePath).toLowerCase();
  const immutableAsset =
    relativePath.startsWith("assets/") ||
    [".png", ".jpg", ".jpeg", ".svg", ".webp", ".ico"].includes(ext);

  if (immutableAsset) {
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }

  if (ext === ".html") {
    response.setHeader("Cache-Control", "no-cache");
    return;
  }

  response.setHeader("Cache-Control", "public, max-age=3600");
}

function sendRangeNotSatisfiable(response, fileSize) {
  response.statusCode = 416;
  response.setHeader("Content-Range", `bytes */${fileSize}`);
  response.end();
}

function sendFile(request, response, filePath, stats) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[ext] || "application/octet-stream";
  const rangeHeader = request.headers.range;

  setCommonHeaders(response);
  setCacheHeaders(response, filePath);
  response.setHeader("Content-Type", contentType);
  response.setHeader("Accept-Ranges", "bytes");
  response.setHeader("Content-Length", stats.size);

  if (!rangeHeader) {
    response.statusCode = 200;

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => {
      if (!response.headersSent) {
        response.statusCode = 500;
      }
      response.end();
    });
    stream.pipe(response);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);

  if (!match) {
    sendRangeNotSatisfiable(response, stats.size);
    return;
  }

  let start;
  let end;

  if (match[1] === "" && match[2] === "") {
    sendRangeNotSatisfiable(response, stats.size);
    return;
  }

  if (match[1] === "") {
    const suffixLength = Number(match[2]);

    if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
      sendRangeNotSatisfiable(response, stats.size);
      return;
    }

    start = Math.max(stats.size - suffixLength, 0);
    end = stats.size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? stats.size - 1 : Number(match[2]);
  }

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= stats.size
  ) {
    sendRangeNotSatisfiable(response, stats.size);
    return;
  }

  end = Math.min(end, stats.size - 1);
  const chunkSize = end - start + 1;

  response.statusCode = 206;
  response.setHeader("Content-Length", chunkSize);
  response.setHeader("Content-Range", `bytes ${start}-${end}/${stats.size}`);

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = fs.createReadStream(filePath, { start, end });
  stream.on("error", () => {
    if (!response.headersSent) {
      response.statusCode = 500;
    }
    response.end();
  });
  stream.pipe(response);
}

function sendNotFound(response) {
  setCommonHeaders(response);
  response.statusCode = 404;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end("Not found");
}

function resolveStaticPath(requestPath) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const safePath = path.normalize(normalizedPath).replace(/^(\.\.[\\/])+/, "");
  const absolutePath = path.join(rootDir, safePath);

  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }

  return absolutePath;
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname;

  if (request.method !== "GET" && request.method !== "HEAD") {
    setCommonHeaders(response);
    response.statusCode = 405;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.setHeader("Allow", "GET, HEAD");
    response.end("Method not allowed");
    return;
  }

  const filePath = resolveStaticPath(pathname);

  if (!filePath) {
    sendNotFound(response);
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendNotFound(response);
      return;
    }

    sendFile(request, response, filePath, stats);
  });
});

server.listen(defaultPort, () => {
  console.log(`KelDel Court local server running at http://localhost:${defaultPort}`);
});
