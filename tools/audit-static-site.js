const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const siteOrigin = "https://keldelcourt.com";

const htmlFiles = fs
  .readdirSync(publicDir)
  .filter((fileName) => fileName.endsWith(".html"))
  .sort();

const failures = [];

function report(fileName, message) {
  failures.push(`${fileName}: ${message}`);
}

function readPublicFile(fileName) {
  return fs.readFileSync(path.join(publicDir, fileName), "utf8");
}

function stripFragmentAndQuery(value) {
  return value.split("#")[0].split("?")[0];
}

function publicPathExists(value) {
  const cleanValue = stripFragmentAndQuery(value);

  if (!cleanValue) {
    return true;
  }

  const relativePath = cleanValue.startsWith("/")
    ? cleanValue.slice(1)
    : cleanValue;
  const targetPath = path.resolve(publicDir, relativePath);

  return targetPath.startsWith(publicDir) && fs.existsSync(targetPath);
}

function getAttribute(tag, attributeName) {
  const pattern = new RegExp(`${attributeName}\\s*=\\s*"([^"]*)"`, "i");
  return tag.match(pattern)?.[1] || "";
}

function validateJsonLd(fileName, source) {
  const scripts = source.matchAll(
    /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const script of scripts) {
    try {
      JSON.parse(script[1]);
    } catch (error) {
      report(fileName, `invalid JSON-LD (${error.message})`);
    }
  }
}

function validateHead(fileName, source) {
  const title = source.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description = source.match(
    /<meta\s+name="description"\s+content="([^"]+)"/i
  )?.[1];
  const canonical = source.match(
    /<link\s+rel="canonical"\s+href="([^"]+)"/i
  )?.[1];

  if (!title) {
    report(fileName, "missing title");
  }

  if (!description) {
    report(fileName, "missing meta description");
  } else if (description.length < 80 || description.length > 170) {
    report(
      fileName,
      `meta description should be 80-170 characters; found ${description.length}`
    );
  }

  if (!canonical) {
    report(fileName, "missing canonical URL");
  } else if (!canonical.startsWith(siteOrigin)) {
    report(fileName, `canonical URL is not on ${siteOrigin}`);
  }

  if (!/<meta\s+property="og:image"\s+content="[^"]+"/i.test(source)) {
    report(fileName, "missing og:image");
  }

  if (!/<meta\s+name="twitter:card"\s+content="summary_large_image"/i.test(source)) {
    report(fileName, "missing summary_large_image Twitter card");
  }
}

function validateIds(fileName, source) {
  const seen = new Set();
  const ids = source.matchAll(/\sid="([^"]+)"/g);

  for (const idMatch of ids) {
    const id = idMatch[1];

    if (seen.has(id)) {
      report(fileName, `duplicate id "${id}"`);
    }

    seen.add(id);
  }
}

function validateImages(fileName, source) {
  const images = source.matchAll(/<img\b[^>]*>/gi);

  for (const image of images) {
    const tag = image[0];
    const src = getAttribute(tag, "src");

    if (!getAttribute(tag, "alt")) {
      report(fileName, `image missing alt text${src ? ` (${src})` : ""}`);
    }

    if (src && !/^(https?:|data:)/i.test(src) && !publicPathExists(src)) {
      report(fileName, `missing image asset ${src}`);
    }
  }
}

function validateLinksAndMedia(fileName, source) {
  const references = source.matchAll(
    /\s(?:href|src|poster|data-src)="([^"]+)"/gi
  );

  for (const reference of references) {
    const value = reference[1];

    if (/^(https?:|mailto:|tel:|#|data:)/i.test(value)) {
      continue;
    }

    if (!publicPathExists(value)) {
      report(fileName, `missing local reference ${value}`);
    }
  }

  const externalLinks = source.matchAll(/<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>/gi);

  for (const link of externalLinks) {
    const tag = link[0];
    const rel = getAttribute(tag, "rel");

    if (getAttribute(tag, "target") === "_blank" && !/\bnoopener\b/i.test(rel)) {
      report(fileName, "external target=_blank link missing rel noopener");
    }
  }
}

for (const fileName of htmlFiles) {
  const source = readPublicFile(fileName);

  validateHead(fileName, source);
  validateJsonLd(fileName, source);
  validateIds(fileName, source);
  validateImages(fileName, source);
  validateLinksAndMedia(fileName, source);
}

if (failures.length > 0) {
  console.error("Static site audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Static site audit passed for ${htmlFiles.length} HTML pages.`);
