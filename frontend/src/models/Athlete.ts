import { NetworkHelper } from "./NetworkHelper";
import { BetInputItem } from "../components/design/BetInput";

export class Athlete {
  private readonly _id: string;
  private readonly _first_name: string;
  private readonly _last_name: string;
  private readonly _country_code: string;
  private readonly _gender: string;
  private readonly _flag: string;

  constructor(
    id: string,
    first_name: string,
    last_name: string,
    country_code: string,
    gender: string,
    flag: string,
  ) {
    this._id = id;
    this._first_name = first_name;
    this._last_name = last_name;
    this._country_code = country_code;
    this._gender = gender;
    this._flag = flag;
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

  public toBetInputItem(): BetInputItem {
    return {
      id: this.id,
      name: `${this._flag}  ${this.first_name} ${this.last_name}`,
    };
  }

  public static fromJson(json: any): Athlete {
    return new Athlete(
      json["id"],
      json["first_name"],
      json["last_name"],
      json["country_code"],
      json["gender"],
      json["flag"],
    );
  }

  public static fetchAll() {
    const builder = (res: any): Athlete[] => {
      return res.map((r: any) => Athlete.fromJson(r));
    };
    return NetworkHelper.fetchAll("/api/athletes", builder);
  }
}
