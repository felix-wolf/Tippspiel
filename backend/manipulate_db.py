from src.database import db_manager
from main import create_app
import argparse


def run_execute_on_db(sql):
    db_manager.execute(sql)


def run_query_on_db(sql):
    print(db_manager.query(args.query))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--exec', required=False, help='sql to execute on database')
    parser.add_argument('--query', required=False, help='sql to execute on database')
    args = parser.parse_args()
    app = create_app("prod")
    with app.app_context():
        if args.exec:
            run_execute_on_db(args.exec)
        elif args.query:
            run_query_on_db(args.query)