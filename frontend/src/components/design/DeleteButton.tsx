import { Shakable } from "./Shakable.tsx";
import { Button } from "./Button.tsx";
import { useState } from "react";
import { Trash2 } from "lucide-react";

type DeleteButtonProps = {
  shaking: boolean;
  onFinalClick: () => void;
};

export function DeleteButton({
  shaking,
  onFinalClick: _onFinalClick,
}: DeleteButtonProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className={"w-40"}>
      <Shakable shaking={shaking}>
        {!confirmDelete && (
          <Button
            onClick={() => setConfirmDelete(true)}
            title={"Löschen"}
            icon={<Trash2 size={16} />}
            type={"negative"}
          />
        )}
        {confirmDelete && (
          <Button
            onClick={() => {
              setConfirmDelete(false);
              _onFinalClick();
            }}
            title={"Wirklich löschen"}
            type={"negative"}
            icon={<Trash2 size={16} />}
          />
        )}
      </Shakable>
    </div>
  );
}
