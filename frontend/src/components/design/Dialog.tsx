import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { Plus, LogIn, Wrench } from "lucide-react";
import { Button } from "./Button";

type Props = React.PropsWithChildren<{
  title: string;
  isOpened: boolean;
  onClose: () => void;
  neutralButtonTitle?: string;
  onNeutralClick?: () => void;
  actionButtonTitle?: string;
  onActionClick?: () => void;
  type: "add" | "enter" | "edit"
}>;

export function DialogModal({
  title,
  isOpened,
  onClose: _onClose,
  actionButtonTitle,
  neutralButtonTitle,
  onActionClick: _onActionClick,
  onNeutralClick: _onNeutralClick,
  type,
  children,
}: Props) {

  return (
    <Dialog open={isOpened} onClose={_onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 sm:mx-0 sm:size-10">
                  {type == "add" &&  <Plus className="size-6 text-blue-500" aria-hidden="true" />}
                  {type == "enter" &&  <LogIn className="size-6 text-blue-500" aria-hidden="true" />}
                  {type == "edit" &&  <Wrench className="size-6 text-blue-500" aria-hidden="true" />}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <DialogTitle as="h3" className="text-base font-semibold text-white">
                    {title}
                  </DialogTitle>
                  <div className="mt-2">
                    {children}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3 justify-center">
              {_onActionClick && actionButtonTitle &&  <Button title={actionButtonTitle} onClick={_onActionClick} type="positive" />}
              {_onNeutralClick && neutralButtonTitle && <Button title={neutralButtonTitle} onClick={_onNeutralClick} type="neutral" />}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
