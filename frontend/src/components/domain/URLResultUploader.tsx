import { Button } from "../design/Button";
import { useCallback, useState } from "react";
import { TextField } from "../design/TextField";
import styles from "./URLResultUploader.module.scss";
import { Event } from "../../models/Event";
import { Shakable } from "../design/Shakable";
import { ManualResultUploader } from "./ManualResultUploader";

type ResultUploaderProps = {
  resultsUploaded: boolean;
  event: Event | undefined;
  resultUrl: string;
  onEventUpdated: (event: Event) => void;
};

export function URLResultUploader({
  resultsUploaded,
  event,
  resultUrl,
  onEventUpdated: _onEventUpdated,
}: ResultUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [shaking, setShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [numberOfErrors, setNumberOfErrors] = useState(0);

  const uploadResults = useCallback(() => {
    if (event) {
      setIsProcessing(true);
      event
        .processUrlForResults(url)
        .then((event) => {
          setIsProcessing(false);
          setIsUploading(false);
          _onEventUpdated(event);
        })
        .catch((_) => {
          setNumberOfErrors(numberOfErrors + 1);
          setIsProcessing(false);
          setShaking(true);
          setTimeout(() => setShaking(false), 300);
        });
    }
  }, [url, event, numberOfErrors]);

  return (
    <div>
      {!isUploading && (
        <Button
          onClick={() => setIsUploading(true)}
          title={"Ergebnis-URL angeben"}
          type={resultsUploaded ? "neutral" : "positive"}
        />
      )}
      {isUploading && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
          className={styles.container}
        >
          <Shakable shaking={shaking}>
            <TextField placeholder={resultUrl} onInput={(i) => setUrl(i)} />
          </Shakable>
          <div className={styles.row}>
            <div className={styles.wide}>
              <Button
                onClick={() => uploadResults()}
                title={"Hochladen"}
                isEnabled={url != "" && !isProcessing}
                type={"positive"}
                width={"flexible"}
              />
            </div>
            <div className={styles.narrow}>
              <Button
                onClick={() => {
                  setIsUploading(false);
                  setNumberOfErrors(0);
                }}
                title={"Abbrechen"}
                type={"negative"}
                width={"flexible"}
              />
            </div>
          </div>
        </form>
      )}
      {numberOfErrors > 2 && (
        <ManualResultUploader
          event={event}
          onEventUpdated={_onEventUpdated}
          resultsUploaded={resultsUploaded}
        />
      )}
    </div>
  );
}
