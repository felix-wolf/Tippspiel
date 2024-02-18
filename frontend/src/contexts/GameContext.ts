import { createContext } from "react";
import { Game } from "../models/Game";

export const GameContext = createContext<Game | undefined>(undefined);

export const GamesContext = createContext<Game[] | undefined>(undefined);
