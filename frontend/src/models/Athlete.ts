import { NetworkHelper } from "./NetworkHelper";

export class Athlete {
  private _id: string;
  private _first_name: string;
  private _last_name: string;
  private _country_code: string;
  private _gender: string;
  constructor(
    id: string,
    first_name: string,
    last_name: string,
    country_code: string,
    gender: string,
  ) {
    this._id = id;
    this._first_name = first_name;
    this._last_name = last_name;
    this._country_code = country_code;
    this._gender = gender;
  }

  get id(): string {
    return this._id;
  }

  get first_name(): string {
    return this._first_name;
  }

  get last_name(): string {
    return this._last_name;
  }

  get country_code(): string {
    return this._country_code;
  }

  get gender(): string {
    return this._gender;
  }

  public toRecord(): Record<string, string> {
    return { a: this.country_code, b: this.last_name };
  }

  public static fetchAll() {
    const builder = (res: any): Athlete[] => {
      return res.map(
        (r: any) =>
          new Athlete(
            r["id"],
            r["first_name"],
            r["last_name"],
            r["country_code"],
            r["gender"],
          ),
      );
    };
    return NetworkHelper.fetchAll("/api/athletes", builder);
  }
}
