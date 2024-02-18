import { PulseLoader } from "react-spinners";
import styles from "./Loader.module.scss";

export default function Loader() {
  return (
    <div className={styles.container}>
      <PulseLoader />
    </div>
  );
}
