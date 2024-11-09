import { Button } from "../design/Button";
import { useEffect, useState } from "react";
import styles from "./EventCreator.module.scss";
import { EventType } from "../../models/user/EventType";
import { Event } from "../../models/Event";
import { URLEventImporter } from "./URLEventImporter.tsx";
import { Game } from "../../models/Game.ts";
import { ManualEventCreator } from "./ManualEventCreator.tsx";

type EventCreatorProps = {
  onClick: (type: EventType, name: string, datetime: Date) => Promise<boolean>;
  types: EventType[] | undefined;
  event?: Event;
  game?: Game;
};

export function EventCreator({
  onClick: _onClick,
  types,
  event,
  game,
}: EventCreatorProps) {
  const [creatingSingleEvent, setCreatingSingleEvent] = useState(false);
  const [importingEvents, setImportingEvents] = useState(false);

  useEffect(() => {
    if (event) setCreatingSingleEvent(true);
  }, [event]);

  return (
    <div className={styles.creatorContainer}>
      {importingEvents && game?.discipline?.eventsUrl && (
        <div className={styles.creatorItem}>
          <URLEventImporter
            game={game}
            eventsUrl={game.discipline.eventsUrl}
            onEventsFetched={() => setImportingEvents(true)}
            onDismiss={() => setImportingEvents(false)}
          />
        </div>
      )}
      {creatingSingleEvent && (
        <div className={styles.creatorItem}>
          <ManualEventCreator
            event={event}
            onClick={_onClick}
            types={types}
            onDismiss={() => setCreatingSingleEvent(false)}
          />
        </div>
      )}
      {
        <div className={styles.container}>
          {!creatingSingleEvent && !importingEvents && (
            <Button
              onClick={() => setCreatingSingleEvent(true)}
              type={"positive"}
              title={"Erstell ein neues Event"}
            />
          )}
          {!importingEvents && !creatingSingleEvent && (
            <Button
              onClick={() => setImportingEvents(true)}
              type={"positive"}
              title={"Importiere Events"}
            />
          )}
        </div>
      }
    </div>
  );
}
