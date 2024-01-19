import { Event } from "../../../models/Event";
import TableList from "../../design/TableList";
import styles from "./ResultsList.module.scss";

type ResultsListProps = {
  event: Event;
};

type ResultListItem = {
  place: number;
  objectName: string;
};

export function ResultsList({ event }: ResultsListProps) {
  return (
    <div>
      <div className={styles.heading}>Ergebnisse</div>
      <TableList
        cellHeight={"short"}
        items={event.results.map((r): ResultListItem => {
          return { place: r.place, objectName: r.object_name };
        })}
        headers={{ place: "Platz", objectName: "Name" }}
        customRenderers={{}}
        displayNextArrow={false}
        maxHeight={360}
      />
    </div>
  );
}
