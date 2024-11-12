import { DialogModal } from "../design/Dialog.tsx";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({
  isOpen,
  onClose: _onClose,
}: SettingsModalProps) {
  return (
    <DialogModal
      title={"Einstellungen"}
      isOpened={isOpen}
      onClose={_onClose}
    ></DialogModal>
  );
}
