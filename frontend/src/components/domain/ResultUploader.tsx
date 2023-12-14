import { Button } from "../design/Button";
import { useCallback, useState } from "react";
import { TextField } from "../design/TextField";
import styles from "./ResultUploader.module.scss";
import { Event } from "../../models/Event";
import { Shakable } from "../design/Shakable";

type ResultUploaderProps = {
  resultsUploaded: boolean;
  event: Event | undefined;

  onEventUpdated: (event: Event) => void;
};

export function ResultUploader({
  resultsUploaded,
  event,
  onEventUpdated: _onEventUpdated,
}: ResultUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [shaking, setShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
        .catch((error) => {
          setIsProcessing(false);
          setShaking(true);
          setTimeout(() => setShaking(false), 300);
          console.log(error);
        });
    }
  }, [url, event]);

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
            <TextField placeholder={"URL"} onInput={(i) => setUrl(i)} />
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
                onClick={() => setIsUploading(false)}
                title={"Abbrechen"}
                type={"negative"}
                width={"flexible"}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
