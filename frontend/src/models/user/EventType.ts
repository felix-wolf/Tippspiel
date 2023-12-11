export class EventType {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _display_name: string;
  private readonly _discipline_id: string;
  private readonly _betting_on: string;

  constructor(
    id: string,
    name: string,
    display_name: string,
    discipline_id: string,
    betting_on: string,
  ) {
    this._id = id;
    this._name = name;
    this._display_name = display_name;
    this._discipline_id = discipline_id;
    this._betting_on = betting_on;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get display_name(): string {
    return this._display_name;
  }

  get discipline_id(): string {
    return this._discipline_id;
  }

  get betting_on(): string {
    return this._betting_on;
  }

  public static fromJson(e: any) {
    return new EventType(
      e["id"],
      e["name"],
      e["display_name"],
      e["discipline_id"],
      e["betting_on"],
    );
  }
}
