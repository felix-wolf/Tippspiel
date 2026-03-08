import argparse
from pprint import pprint

from main import create_app
from src.athlete_duplicates import build_merge_preview, find_duplicate_candidates, merge_athletes


def _build_parser():
    root_parser = argparse.ArgumentParser(add_help=False)
    root_parser.add_argument(
        "--env",
        default="prod",
        choices=["dev", "test", "prod"],
        help="Konfiguration, mit der die App und die Datenbank geladen werden.",
    )
    subcommand_parser = argparse.ArgumentParser(add_help=False)
    subcommand_parser.add_argument(
        "--env",
        choices=["dev", "test", "prod"],
        default=argparse.SUPPRESS,
        help="Konfiguration, mit der die App und die Datenbank geladen werden.",
    )
    parser = argparse.ArgumentParser(
        description="Findet doppelte Athleten und fuehrt sichere Merges aus.",
        parents=[root_parser],
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    find_parser = subparsers.add_parser(
        "find",
        help="Zeigt moegliche Dubletten an.",
        parents=[subcommand_parser],
    )
    find_parser.add_argument(
        "--min-score",
        type=float,
        default=0.84,
        help="Minimaler Aehnlichkeitswert zwischen 0 und 1.",
    )
    find_parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Maximale Anzahl ausgegebener Treffer.",
    )

    merge_parser = subparsers.add_parser(
        "merge",
        help="Ersetzt einen Athleten durch einen anderen.",
        parents=[subcommand_parser],
    )
    merge_parser.add_argument("--old-athlete-id", required=True, help="Zu entfernender Athlet.")
    merge_parser.add_argument("--new-athlete-id", required=True, help="Ziel-Athlet.")
    merge_parser.add_argument(
        "--allow-mismatch",
        action="store_true",
        help="Erlaubt den Merge auch bei abweichenden Stammdaten.",
    )
    merge_parser.add_argument(
        "--execute",
        action="store_true",
        help="Fuehrt den Merge wirklich aus. Ohne diesen Schalter wird nur eine Vorschau gezeigt.",
    )

    return parser


def _run_find(min_score, limit):
    candidates = find_duplicate_candidates(min_score=min_score)
    if not candidates:
        print("Keine moeglichen Dubletten gefunden.")
        return

    for candidate in candidates[:limit]:
        print(
            f"{candidate['score']:.3f} | "
            f"{candidate['left']['first_name']} {candidate['left']['last_name']} [{candidate['left']['id']}] <-> "
            f"{candidate['right']['first_name']} {candidate['right']['last_name']} [{candidate['right']['id']}]"
        )
        print(
            f"    {candidate['left']['country_code']} | {candidate['left']['discipline']} | {candidate['left']['gender']}"
        )


def _run_merge(old_athlete_id, new_athlete_id, allow_mismatch, execute):
    preview = build_merge_preview(old_athlete_id=old_athlete_id, new_athlete_id=new_athlete_id)
    print("Merge-Vorschau:")
    pprint(
        {
            "old_athlete": preview["old_athlete"],
            "new_athlete": preview["new_athlete"],
            "warnings": preview["warnings"],
            "prediction_updates": len(preview["prediction_updates"]),
            "result_updates": len(preview["result_updates"]),
            "conflicts": preview["conflicts"],
        }
    )

    if not execute:
        print("Kein Merge ausgefuehrt. Fuer den echten Lauf --execute angeben.")
        return

    result = merge_athletes(
        old_athlete_id=old_athlete_id,
        new_athlete_id=new_athlete_id,
        allow_mismatch=allow_mismatch,
    )
    print("Merge abgeschlossen:")
    pprint(result)


if __name__ == "__main__":
    parser = _build_parser()
    args = parser.parse_args()

    app = create_app(args.env)
    with app.app_context():
        if args.command == "find":
            _run_find(min_score=args.min_score, limit=args.limit)
        elif args.command == "merge":
            _run_merge(
                old_athlete_id=args.old_athlete_id,
                new_athlete_id=args.new_athlete_id,
                allow_mismatch=args.allow_mismatch,
                execute=args.execute,
            )
