export class Utils {
  static colors: string[] = [
    "#FF6347",
    "#90EE90",
    "#FFC0CB",
    "#FFE4C4",
    "#FFA500",
    "#FF69B4",
    "#008080",
    "#FF1493",
    "#00BFFF",
    "#FFD700",
    "#8B4513",
    "#98FB98",
    "#DA70D6",
    "#FF00FF",
    "#00FF7F",
    "#4682B4",
    "#FF4500",
    "#00FF00",
    "#000080",
    "#FFA500",
    "#800080",
    "#00FFFF",
    "#FF4500",
    "#46725A",
    "#FF8C00",
    "#008000",
    "#FF6347",
    "#808080",
  ];

  static getColorFromId(id: string): string {
    let identifier = id;
    if (identifier.length > 5) {
      identifier = identifier.slice(id.length - 5, id.length);
    }
    const num = Number("0x" + identifier);
    return `${Utils.colors[num % Utils.colors.length]}`;
  }
}
