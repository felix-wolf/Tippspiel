import { Button } from "../design/Button";
import { useEffect, useState } from "react";
import styles from "./EventCreator.module.scss";
import { EventType } from "../../models/user/EventType";
import { Event } from "../../models/Event";
import { URLEventImporter } from "./URLEventImporter.tsx";
import { Game } from "../../models/Game.ts";
import { ManualEventCreator } from "./ManualEventCreator.tsx";
import { cls } from "../../styles/cls.ts";

type EventCreatorProps = {
  onClick: (type: EventType, name: string, datetime: Date) => Promise<boolean>;
  types: EventType[] | undefined;
  event?: Event;
  game?: Game;
  onEventCreated?: () => void;
  onEventDeleted?: () => void;
};

export function EventCreator({
  onClick: _onClick,
  types,
  event,
  game,
  onEventCreated: _onEventCreated,
  onEventDeleted: _onEventDeleted,
}: EventCreatorProps) {
  const [creatingSingleEvent, setCreatingSingleEvent] = useState(false);
  const [importingEvents, setImportingEvents] = useState(false);

  useEffect(() => {
    if (event) setCreatingSingleEvent(true);
  }, [event]);

  return (
    <div className={cls(styles.creatorContainer, event && styles.height)}>
      {importingEvents && game?.discipline?.eventsUrl && (
        <div className={styles.creatorItem}>
          <URLEventImporter
            game={game}
            eventsUrl={game.discipline.eventsUrl}
            onEventsFetched={() => setImportingEvents(true)}
            onDismiss={() => setImportingEvents(false)}
            onEventsSaved={() => {
              setImportingEvents(false);
              if (_onEventCreated) _onEventCreated();
            }}
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
            onEventSaved={() => {
              setCreatingSingleEvent(false);
              if (_onEventCreated) _onEventCreated();
            }}
            onEventDeleted={() => {
              if (_onEventDeleted) _onEventDeleted();
            }}
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
