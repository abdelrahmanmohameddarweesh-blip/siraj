import type { SoundId } from "./soundPolicy";
export function soundAsset(id: SoundId) {
  switch (id) {
    case "athan":
      return require("../../assets/sounds/athan.wav");
    case "wudu_drop":
      return require("../../assets/sounds/wudu_drop.wav");
    case "wudu_soft":
      return require("../../assets/sounds/wudu_soft.wav");
    case "prayer_bell":
      return require("../../assets/sounds/prayer_bell.wav");
    case "prayer_soft":
      return require("../../assets/sounds/prayer_soft.wav");
    case "gentle":
      return require("../../assets/sounds/gentle.wav");
    default:
      return null;
  }
}
