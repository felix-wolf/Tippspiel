import { useRef, useState } from "react";
import { DialogModal } from "../design/Dialog";
import { GameCreator } from "./GameCreator";

type CreateGameModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreate?: (name: string, password: string, disciplineId: string) => Promise<void>;
};

export default function CreateGameModal({ isOpen, onClose: _onClose, onCreate: _onCreate }: CreateGameModalProps) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [disciplineId, setDisciplineId] = useState<string | undefined>(undefined);
    const [shake, setShake] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const submitting = useRef(false);
    function close() {
        if (!submitting.current) _onClose();
    }
    async function onCreate() {
        if (!_onCreate || submitting.current) return;
        if (!name.trim() || !password.trim() || !disciplineId) {
            setShake(true);
            setError("Bitte gib Name, Passwort und Sportart an.");
            setTimeout(() => setShake(false), 300);
            return;
        }
        submitting.current = true;
        setPending(true);
        setError("");
        try {
            await _onCreate(name, password, disciplineId);
            setPassword("");
        } catch {
            setError("Das Tippspiel konnte nicht erstellt werden. Bitte versuche es erneut.");
        } finally {
            submitting.current = false;
            setPending(false);
        }
    }
    return (

        <DialogModal
            type="add"
            title={"Spiel erstellen"}
            isOpened={isOpen}
            onClose={close}
            actionButtonTitle={"Erstellen"}
            neutralButtonTitle={"Abbrechen"}
            onActionClick={onCreate}
            onNeutralClick={close}
            actionButtonEnabled={!pending && name.trim().length > 0 && password.trim().length > 0 && !!disciplineId}
        >
            <GameCreator
                shake={shake}
                onSetName={(i) => setName(i)}
                onSetPassword={(i) => setPassword(i)}
                onSetDisciplineId={(disciplineId) => setDisciplineId(disciplineId?.id)}
            />
            {error && <p role="alert" className="text-red-300">{error}</p>}
        </DialogModal >
    )

}