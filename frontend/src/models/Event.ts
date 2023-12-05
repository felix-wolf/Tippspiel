import { NetworkHelper } from "./NetworkHelper";

export class Event {
  private _id: string;
  private _name: string;
  private _game_id: string;
  private _type: string;
  private _datetime: Date;
  constructor(
    id: string,
    name: string,
    game_id: string,
    type: string,
    datetime: string,
  ) {
    this._id = id;
    this._name = name;
    this._game_id = game_id;
    this._type = type;
    this._datetime = new Date(Date.parse(datetime));
  }

  public static fetchAll(game_id: string): Promise<Event[]> {
    const builder = (res: any): Event[] => {
      return res.map((e: any) => {
        return new Event(
          e["id"],
          e["name"],
          e["game_id"],
          e["type"],
          e["datetime"],
        );
      });
    };
    return NetworkHelper.fetchOne(`/api/event/get?game_id=${game_id}`, builder);
  }
}
