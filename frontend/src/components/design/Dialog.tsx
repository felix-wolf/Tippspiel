import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { Plus, LogIn, Wrench, X } from "lucide-react";
import { Button } from "./Button";
import { Shakable } from './Shakable';

type Props = React.PropsWithChildren<{
  title: string;
  subtitle?: string;
  isOpened: boolean;
  onClose: () => void;
  neutralButtonTitle?: string;
  onNeutralClick?: () => void;
  actionButtonTitle?: string;
  onActionClick?: () => void;
  actionButtonEnabled: boolean;
  type: "add" | "enter" | "edit"
  shakingActionButton?: boolean
}>;

export function DialogModal({
  title,
  subtitle,
  isOpened,
  onClose: _onClose,
  actionButtonTitle,
  onActionClick: _onActionClick,
  actionButtonEnabled,
  neutralButtonTitle,
  onNeutralClick: _onNeutralClick,
  type,
  shakingActionButton,
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
            className="relative transform overflow-hidden rounded-3xl bg-slate-900/95 text-slate-50 shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            {/* Header */}
            <div className="bg-slate-900/95 flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-700 flex items-center justify-center">
                  {type == "add" && <Plus size={20} color="white" />}
                  {type == "enter" && <LogIn size={20} color="white" />}
                  {type == "edit" && <Wrench size={20} color="white" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                  <p className="text-xs text-slate-400">{subtitle}</p>
                </div>
              </div>
              <button
                onClick={_onClose}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6 text-sm">
              {children}
            </div>
            {((_onNeutralClick && neutralButtonTitle) || (_onActionClick && actionButtonTitle)) && (
              <div className="bg-gray-700/25 px-4 py-3 grid grid-cols-2 px-6 gap-3 justify-center">
                {_onNeutralClick && neutralButtonTitle && <Button title={neutralButtonTitle} onClick={_onNeutralClick} type="neutral" />}
                {_onActionClick && actionButtonTitle &&
                  <Shakable shaking={shakingActionButton ?? false}>
                    <Button
                      title={actionButtonTitle}
                      onClick={_onActionClick}
                      type="positive"
                      isEnabled={actionButtonEnabled}
                    />
                  </Shakable>
                }
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
