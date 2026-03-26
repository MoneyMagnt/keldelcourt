const http = require("http");
const fs = require("fs");
const path = require("path");
const enquiryHandler = require("./api/enquiry");

const rootDir = __dirname;
const defaultPort = Number(process.env.PORT || 3000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[ext] || "application/octet-stream";
  response.statusCode = 200;
  response.setHeader("Content-Type", contentType);
  fs.createReadStream(filePath).pipe(response);
}

function sendNotFound(response) {
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

  if (pathname === "/api/enquiry") {
    try {
      await enquiryHandler(request, response);
    } catch (error) {
      response.statusCode = 500;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify({
        ok: false,
        message: "The local enquiry server encountered an unexpected error.",
      }));
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.statusCode = 405;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
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

    if (request.method === "HEAD") {
      response.statusCode = 200;
      response.end();
      return;
    }

    sendFile(response, filePath);
  });
});

server.listen(defaultPort, () => {
  console.log(`KelDel Court local server running at http://localhost:${defaultPort}`);
});
