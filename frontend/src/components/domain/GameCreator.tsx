import styles from "./GameCreator.module.scss";
import { TextField } from "../design/TextField";
import { Button } from "../design/Button";
import { useEffect, useState } from "react";
import { DropDown, DropDownOption } from "../design/DropDown";
import { Discipline } from "../../models/user/Discipline";

type GameCreatorProps = {
  onCreate: (name: string, password?: string, disciplineId?: string) => void;
  onClose: () => void;
};

export function GameCreator({
  onCreate: _onCreate,
  onClose: _onClose,
}: GameCreatorProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [disciplines, setDisciplines] = useState<DropDownOption[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<
    DropDownOption | undefined
  >(undefined);

  useEffect(() => {
    {
      Discipline.fetchAll()
        .then((disciplines) => {
          const options: DropDownOption[] = disciplines.map((d) => {
            return { id: d.id, label: d.name };
          });
          setDisciplines(options);
          if (options.length > 0) setSelectedDiscipline(options[0]);
        })
        .catch((error) => console.log(error));
    }
  }, []);

  return (
    <div className={styles.container}>
      <div>
        <TextField
          onInput={(i) => {
            setName(i);
          }}
          placeholder={"Name"}
        />
        <div className={styles.row}>
          <TextField
            onInput={(i) => {
              setPassword(i);
            }}
            placeholder={"Passwort (optional)"}
            type={"password"}
          />
          <DropDown
            options={disciplines}
            onChange={(o) => setSelectedDiscipline(o)}
            initial={selectedDiscipline}
          />
        </div>
      </div>
      <div className={styles.buttonsContainer}>
        <Button
          onClick={_onClose}
          title={"Schließen"}
          type={"negative"}
          width={"flexible"}
          height={"flexible"}
        />
        <Button
          onClick={() => {
            _onCreate(
              name,
              password ? password : undefined,
              selectedDiscipline ? selectedDiscipline?.id : undefined,
            );
          }}
          title={"Erstellen"}
          type={"positive"}
          width={"flexible"}
          isEnabled={name != ""}
        />
      </div>
    </div>
  );
}
