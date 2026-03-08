from manage_athlete_duplicates import _build_parser


def test_parser_accepts_env_before_subcommand():
    parser = _build_parser()
    args = parser.parse_args(["--env", "test", "find"])
    assert args.env == "test"
    assert args.command == "find"


def test_parser_accepts_env_after_subcommand():
    parser = _build_parser()
    args = parser.parse_args(["find", "--env", "test"])
    assert args.env == "test"
    assert args.command == "find"
