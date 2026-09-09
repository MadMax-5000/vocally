export const UGC_FONTS = {
  anton: { family: "Anton", file: "Anton-Regular.ttf" },
  "arial-black": { family: "Archivo Black", file: "ArchivoBlack-Regular.ttf" },
  "comic-sans": { family: "Comic Neue Bold", file: "ComicNeue-Bold.ttf" },
  montserrat: { family: "Montserrat Black", file: "Montserrat-Black.ttf" },
  "bebas-neue": { family: "Bebas Neue", file: "BebasNeue-Regular.ttf" },
  "permanent-marker": { family: "Permanent Marker", file: "PermanentMarker-Regular.ttf" },
  roboto: { family: "Roboto Black", file: "Roboto-Black.ttf" },
} as const;

export type UgcFontKey = keyof typeof UGC_FONTS;

export const DEFAULT_UGC_FONT: UgcFontKey = "anton";

export function ugcFontFamily(key: UgcFontKey = DEFAULT_UGC_FONT): string {
  return UGC_FONTS[key].family;
}
