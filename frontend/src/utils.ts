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

  static getDoubleDigit(digits: string | number): string {
    const d = digits.toString();
    if (d.length == 2) return d;
    return "0" + d;
  }

  public static getTimeString(
    datetime: Date,
    withSeconds: boolean = false,
  ): string {
    const hours = this.getDoubleDigit(datetime.getHours());
    const minutes = this.getDoubleDigit(datetime.getMinutes());
    const seconds = this.getDoubleDigit(datetime.getSeconds());
    return withSeconds
      ? `${hours}:${minutes}:${seconds}`
      : `${hours}:${minutes}`;
  }

  public static dateToString(date: Date): string {
    return `${this.getDoubleDigit(
      date.getDate().toString(),
    )}.${this.getDoubleDigit(
      (date.getMonth() + 1).toString(),
    )}.${date.getFullYear()} - ${Utils.getTimeString(date)}`;
  }

  public static dateToIsoString(date: Date): string {
    return `${date.getFullYear()}-${this.getDoubleDigit(
      date.getMonth() + 1,
    ).toString()}-${this.getDoubleDigit(
      date.getDate().toString(),
    )} ${Utils.getTimeString(date, true)}`;
  }
}
