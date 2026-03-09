import { NetworkHelper } from "./NetworkHelper";

export type GameStatsDetail = {
  id?: string;
  name: string;
  points?: number;
  average_points?: number;
  pick_count?: number;
  event_count?: number;
  delta?: number;
  opponent_average_points?: number;
  location?: string | null;
  race_format?: string | null;
};

export type GameStatsOverview = {
  total_points: number;
  resolved_predictions: number;
  resolved_events: number;
  exact_hits: number;
  exact_hit_rate: number;
  scoring_picks: number;
  scoring_pick_rate: number;
  average_points_per_event: number;
};

export type GameStatsPayload = {
  overview: GameStatsOverview;
  locations: {
    best_total_points: GameStatsDetail | null;
    best_vs_opponents: GameStatsDetail | null;
    worst_total_points: GameStatsDetail | null;
    worst_vs_opponents: GameStatsDetail | null;
  };
  race_formats: {
    best_total_points: GameStatsDetail | null;
    worst_total_points: GameStatsDetail | null;
  };
  athletes: {
    most_picked: GameStatsDetail | null;
    most_points: GameStatsDetail | null;
    low_return_frequent: GameStatsDetail | null;
  };
  countries: {
    most_points: GameStatsDetail | null;
    low_return_frequent: GameStatsDetail | null;
  };
  events: {
    best_event: GameStatsDetail | null;
    worst_event: GameStatsDetail | null;
  };
};

export class GameStats {
  public static buildCacheKey(gameId: string, userId: string) {
    return `game-stats-${gameId}-${userId}`;
  }

  public static fetchOne(game_id: string, user_id: string): Promise<GameStatsPayload> {
    const params = new URLSearchParams({ game_id: game_id, user_id: user_id });
    return NetworkHelper.fetchOne(`/api/game/stats?${params.toString()}`, (res) => {
      return res as GameStatsPayload;
    });
  }
}
