import { Event } from "../../../models/Event";
import TableList from "../../design/TableList";
import styles from "./ResultsList.module.scss";

type ResultsListProps = {
  event: Event;
};

type ResultListItem = {
  place: number;
  objectName: string;
  time: string | undefined;
  behind: string | undefined;
};

export function ResultsList({ event }: ResultsListProps) {
  console.log(window.innerWidth);
  return (
    <div>
      <div className={styles.heading}>Ergebnisse</div>
      <TableList
        cellHeight={"short"}
        items={event.results.map((r): ResultListItem => {
          return {
            place: r.place,
            objectName: r.object_name,
            time: r.time,
            behind: r.behind,
          };
        })}
        headers={{
          place: "Platz",
          objectName: "Name",
          time: "Zeit",
          behind: "Rückstand",
        }}
        customRenderers={{}}
        displayNextArrow={false}
        maxHeight={360}
      />
    </div>
  );
}
