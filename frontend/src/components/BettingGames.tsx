import styles from "./BettingGames.module.scss";
import { useCallback, useEffect, useState } from "react";
import { BettingGame, BettingGameItem } from "./BettingGameItem";

export function BettingGames() {
  const [games, setGames] = useState<BettingGame[]>([]);
  const [numSpacer, setNumSpacer] = useState(2);

  useEffect(() => {
    fetch("/api/betting_games").then((res) =>
      res.json().then((data) => {
        setGames(data);
        setNumSpacer(3 - (data.length % 3));
      }),
    );
  }, []);

  const onCreate = useCallback((name: string, password?: string) => {
    let pw = "";
    if (password) pw = `&pw=${password}`;
    fetch(`/api/game/create?name=${name}${pw}`).then((res) => {
      if (res.status == 200) {
      } else {
        res.text().then((text) => {
          console.log(text);
        });
      }
    });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.heading}>Tippspiele</div>
      <div className={styles.list}>
        <BettingGameItem
          key={"placeholder"}
          is_placeholder={true}
          onCreate={onCreate}
        />
        {games.map((game, index) => (
          <BettingGameItem key={index} game={game} />
        ))}
        {[...Array(numSpacer)].map((_, index) => (
          <BettingGameItem key={`spacer${index}`} is_hidden={true} />
        ))}
      </div>
    </div>
  );
}
