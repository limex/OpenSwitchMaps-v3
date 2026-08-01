const fs = require("fs/promises");
const https = require("https");
const path = require("path");

const mapsPath = path.join(__dirname, "..", "src", "maps.js");
const outputDirectory = path.join(__dirname, "..", "src", "favicons");

function fetchFavicon(domain, url, redirectsRemaining = 3) {
  const faviconUrl =
    url ||
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

  return new Promise((resolve, reject) => {
    https
      .get(faviconUrl, (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location &&
          redirectsRemaining > 0
        ) {
          response.resume();
          resolve(
            fetchFavicon(
              domain,
              new URL(response.headers.location, faviconUrl).toString(),
              redirectsRemaining - 1
            )
          );
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`${domain}: HTTP ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", (error) => reject(new Error(`${domain}: ${error.message}`)));
  });
}

async function main() {
  const maps = await fs.readFile(mapsPath, "utf8");
  const domains = [
    ...new Set(
      [...maps.matchAll(/^\s*domain:\s*["']([^"']+)["'],?$/gm)].map(
        (match) => match[1]
      )
    ),
  ].sort();

  await fs.mkdir(outputDirectory, { recursive: true });

  const results = await Promise.allSettled(
    domains.map(async (domain) => {
      const favicon = await fetchFavicon(domain);
      await fs.writeFile(path.join(outputDirectory, `${domain}.png`), favicon);
      return domain;
    })
  );
  const failures = results.filter((result) => result.status === "rejected");

  console.log(`Fetched ${results.length - failures.length}/${results.length} favicons.`);
  if (failures.length) {
    console.warn(
      `${failures.length} domains have no Google favicon; the UI will use the local default icon for them.`
    );
    failures.forEach((failure) => console.error(failure.reason.message));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
