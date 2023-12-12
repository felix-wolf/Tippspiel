import { NetworkHelper } from "./NetworkHelper";
import { BetInputItem } from "../components/design/BetInput";

export class Country {
  private readonly _code: string;
  private readonly _name: string;
  private readonly _flag: string;

  constructor(code: string, name: string, flag: string) {
    this._code = code;
    this._name = name;
    this._flag = flag;
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get flag(): string {
    return this._flag;
  }

  public toBetInputItem(): BetInputItem {
    return { id: this.code, name: `${this.flag}  ${this.name}` };
  }

  public static fetchAll() {
    const builder = (res: any): Country[] => {
      return res.map((r: any) => new Country(r["code"], r["name"], r["flag"]));
    };
    return NetworkHelper.fetchAll("/api/countries", builder);
  }
}
