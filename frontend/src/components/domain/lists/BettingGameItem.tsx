import { useCallback, useState } from "react";
import { Game } from "../../../models/Game";
import CreateGameModal from "../CreateGameModal";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { DialogModal } from "../../design/Dialog";
import { GameJoiner } from "../GameJoiner";

export type BettingGameItemGame = {
  game?: Game;
  type: "real" | "add";
};

type BettingGameItemProps = {
  onGameSelect?: (id: string) => void;
  onCreate?: (name: string, password?: string, disciplineId?: string) => void;
  onJoin?: (game_id: string, password?: string) => Promise<boolean>;
  item?: BettingGameItemGame;
  type: "real" | "add";
  joined?: boolean;
};

export function BettingGameItem({
  item,
  joined = true,
  onGameSelect: _onGameSelect,
  onCreate: _onCreate,
  onJoin: _onJoin,
  type,
}: BettingGameItemProps) {
  const [showCreateGameModal, setShowCreateGameModal] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showJoiningModal, setShowJoiningModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordShaking, setPasswordShaking] = useState(false);


  const onJoinGameClick = useCallback(() => {
    if (!showCreateGameModal) {
      if (_onGameSelect && item) {
        if (joined && item.game?.id) {
          _onGameSelect(item.game.id);
        } else {
          setShowJoiningModal(true)
        }
      }
    }
  }, [type, item, showCreateGameModal, joined]);

  const onJoinClicked = useCallback(() => {
    if (item?.game?.hasPassword && password == "") {
      console.log
      setPasswordShaking(true);
      setTimeout(() => setPasswordShaking(false), 300);
    } else {
      
      if (_onJoin && item?.game?.id) {
        _onJoin(item.game.id, password).then((success) => {
          setPasswordShaking(!success);
          setTimeout(() => setPasswordShaking(false), 300);
        });
      }
    }
  }, [password, item, passwordShaking],
  );
  return (
    <>
      {type == "add" && (
        <div onClick={() => setShowCreateGameModal(true)} className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center hover:opacity-90 cursor-pointer">
          <span className="text-3xl font-bold">+</span>
          <p className="mt-1 text-sm font-medium">Neu</p>
          <CreateGameModal isOpen={showCreateGameModal} onClose={() => setShowCreateGameModal(false)} onCreate={_onCreate} />
        </div>
      )}
      {type != "add" && (
        <div
          onClick={onJoinGameClick}
          className="bg-white/70 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 border border-transparent hover:border-sky-300 cursor-pointer flex flex-col justify-center items-center text-center"
        >
          <h3 className="font-medium text-gray-800 text-sm sm:text-base">
            {item?.game?.name}
          </h3>
          <DialogModal
            type="enter"
            title="Spiel beitreten"
            isOpened={showJoiningModal}
            onClose={() => setShaking(false)}
            actionButtonTitle="Betreten"
            onActionClick={onJoinClicked}
            neutralButtonTitle="Abbrechen"
            onNeutralClick={() => {
              setShowJoiningModal(false)
              setPassword("")
            }}
          >

            {item?.game && <GameJoiner onEnterPassword={(i) => setPassword(i)} game={item.game} shaking={passwordShaking} />}
          </DialogModal>
        </div>
      )}
    </>
  );
}
