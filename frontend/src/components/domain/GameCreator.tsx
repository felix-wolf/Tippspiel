import { TextField } from "../design/TextField";
import { useEffect, useState } from "react";
import { DropDown, DropDownOption } from "../design/DropDown";
import { Discipline } from "../../models/user/Discipline";
import { Shakable } from "../design/Shakable";

type GameCreatorProps = {
  onSetName: (name: string) => void;
  onSetPassword?: (password: string) => void;
  onSetDisciplineId: (disciplineId: DropDownOption | undefined) => void;
  shake?: boolean;
};

export function GameCreator({
  onSetName: _onSetName,
  onSetPassword: _onSetPassword,
  onSetDisciplineId: _onSetDisciplineId,
  shake = false,
}: GameCreatorProps) {
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
          if (options.length > 0) {
            setSelectedDiscipline(options[0]);
            _onSetDisciplineId(options[0]);
          }
        })
        .catch((error) => console.log(error));
    }
  }, []);

  return (
    <Shakable shaking={shake}>
      <div className="w-100 flex flex-col gap-6">
        <TextField
          onInput={(i) => {
            _onSetName(i);
          }}
          placeholder={"Name"}
          autoComplete="off"
        />
        <TextField
          onInput={(i) => {
            _onSetPassword && _onSetPassword(i);
          }}
          placeholder={"Passwort (optional)"}
          type={"password"}
          autoComplete="off"
        />
        <DropDown
          options={disciplines}
          onChange={(o) => _onSetDisciplineId(o)}
          initial={selectedDiscipline}
        />
      </div>
    </Shakable>
  );
}
