import { Button } from "../design/Button";
import { useCallback, useState } from "react";
import { Event } from "../../models/Event";
import { BetPlacer } from "./BetPlacer";
import { Prediction } from "../../models/Bet";
import styles from "./ManualResultUploader.module.scss";

type ResultUploaderProps = {
  resultsUploaded: boolean;
  event: Event | undefined;
  onEventUpdated: (event: Event) => void;
};

export function ManualResultUploader({
  resultsUploaded,
  event,
  onEventUpdated: _onEventUpdated,
}: ResultUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const uploadResults = useCallback(
    (results: Prediction[]) => {
      if (event) {
        setIsProcessing(true);
        event
          .processManualResults(results)
          .then((event) => {
            setIsProcessing(false);
            setIsUploading(false);
            _onEventUpdated(event);
          })
          .catch((_) => {
            setIsProcessing(false);
          });
      }
    },
    [event],
  );

  return (
    <div className={styles.container}>
      {!isUploading && (
        <Button
          onClick={() => setIsUploading(true)}
          title={"Ergebnisse manuell angeben"}
          type={resultsUploaded ? "neutral" : "positive"}
        />
      )}
      {isUploading && event && (
        <div>
          <BetPlacer
            onSave={uploadResults}
            event={event}
            tryLoadExistingBet={false}
            saveEnabled={!isProcessing}
            enteringResults={true}
          />
        </div>
      )}
    </div>
  );
}
