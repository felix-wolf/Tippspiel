import { useState } from "react";
import { User } from "../../models/User";
import Colorful from "@uiw/react-color-colorful";
import { Button } from "../design/Button";
import { useSetCurrentUser } from "../../contexts/UserContext";

type ColorUpdaterProps = {
  user: User;
  onUpdated: () => void;
};

export function ColorUpdater({
  user,
  onUpdated: _onUpdated,
}: ColorUpdaterProps) {
  const [color, setColor] = useState(user.color);
  const [isPicking, setIsPicking] = useState(false);
  const setCurrentUser = useSetCurrentUser();

  function saveChoice() {
    User.updateColor(color).then((user) => {
      setCurrentUser(user);
      setIsPicking(false);
      _onUpdated();
    });
  }

  function reset() {
    setIsPicking(false);
    setColor(user.color);
  }

  return (
    <div className="">
      {!isPicking && (
        <div className={""}>
          <Button
            onClick={() => setIsPicking(true)}
            title={"Farbe ändern"}
          />
        </div>
      )}
      {isPicking && (
        <div className={""}>
          <Colorful
            color={color}
            disableAlpha={true}
            onChange={(color) => {
              setColor(color.hex);
            }}
          />
          <div className={"flex flex-row gap-2"}>
            <Button
              onClick={() => saveChoice()}
              title={"Speichern"}
              type={"positive"}
            />
            <div style={{ height: 16 }}>
              <Button
                onClick={() => reset()}
                title={"Abbrechen"}
                type={"negative"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
