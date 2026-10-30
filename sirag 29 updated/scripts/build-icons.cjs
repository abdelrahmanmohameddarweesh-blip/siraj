const fs = require("node:fs/promises");
const path = require("node:path");
const {
  generateImageAsync,
  generateImageBackgroundAsync,
  compositeImagesAsync,
} = require("@expo/image-utils");

const projectRoot = path.resolve(__dirname, "..");
async function main() {
  const src = path.join(projectRoot, "assets/store/icon-master.png");
  for (const [file, size, opaque] of [
    ["assets/store/adaptive-foreground.png", 1024, false],
    ["assets/store/icon.png", 1024, true],
    ["store-listing/icon-512.png", 512, true],
  ]) {
    // Adaptive artwork must fit Android's central safe area. The legacy/store
    // icon can use more of the opaque square because it isn't overscanned.
    const artworkSize = opaque ? size : Math.round(size * 0.78);
    const result = await generateImageAsync(
      { projectRoot, cacheType: "siraj-brand-icons" },
      {
        src,
        name: path.basename(file),
        width: artworkSize,
        height: artworkSize,
        resizeMode: "contain",
        ...(opaque
          ? { backgroundColor: "#082B2A", removeTransparency: true }
          : {}),
      },
    );
    let source = result.source;
    if (!opaque) {
      const background = await generateImageBackgroundAsync({
        width: size,
        height: size,
        resizeMode: "contain",
        backgroundColor: "transparent",
      });
      source = await compositeImagesAsync({
        foreground: source,
        background,
        x: Math.round((size - artworkSize) / 2),
        y: Math.round((size - artworkSize) / 2),
      });
    }
    await fs.writeFile(path.join(projectRoot, file), source);
    process.stdout.write(`Exported ${file}: ${size}×${size}\n`);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
