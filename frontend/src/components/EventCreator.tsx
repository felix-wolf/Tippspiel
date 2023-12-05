import { Button } from "./Button";
import { useCallback } from "react";

type EventCreatorProps = {};

export function EventCreator({}: EventCreatorProps) {
  const onCreate = useCallback(() => {
    console.log("neu");
  }, [EventCreator]);

  return (
    <Button
      onClick={onCreate}
      type={"positive"}
      title={"Erstell ein neues Event"}
    />
  );
}
