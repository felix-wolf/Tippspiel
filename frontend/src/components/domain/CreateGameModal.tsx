import { useState } from "react";
import { DialogModal } from "../design/Dialog";
import { GameCreator } from "./GameCreator";

type CreateGameModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreate?: (name: string, password?: string, disciplineId?: string) => void;
};

export default function CreateGameModal({ isOpen, onClose: _onClose, onCreate: _onCreate }: CreateGameModalProps) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [disciplineId, setDisciplineId] = useState<string | undefined>(undefined);
    const [shake, setShake] = useState(false);
    function onCreate() {
        if (_onCreate) {
            if (name == "" || disciplineId == "" || disciplineId == undefined) {
                setShake(true);
                setTimeout(() => setShake(false), 300);
            }
            _onCreate(name, password, disciplineId);
        }
    }
    return (

        <DialogModal
            type="add"
            title={"Spiel erstellen"}
            isOpened={isOpen}
            onClose={_onClose}
            actionButtonTitle={"Erstellen"}
            neutralButtonTitle={"Abbrechen"}
            onActionClick={onCreate}
            onNeutralClick={_onClose}
            actionButtonEnabled={name.length > 0 && disciplineId !== undefined}
        >
            <GameCreator
                shake={shake}
                onSetName={(i) => setName(i)}
                onSetPassword={(i) => setPassword(i)}
                onSetDisciplineId={(disciplineId) => setDisciplineId(disciplineId?.id)}
            />
        </DialogModal >
    )

}