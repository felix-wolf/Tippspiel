import logging
import sqlite3

import pytest

from src.database import db_manager


def test_query_logs_and_raises_sql_errors(app, caplog):
    with app.app_context():
        caplog.set_level(logging.ERROR, logger=app.logger.name)

        with pytest.raises(sqlite3.OperationalError):
            db_manager.query("SELECT * FROM DefinitelyMissing")

    assert "Database query failed." in caplog.text
    assert "DefinitelyMissing" in caplog.text


def test_execute_logs_and_raises_sql_errors(app, caplog):
    with app.app_context():
        caplog.set_level(logging.ERROR, logger=app.logger.name)

        with pytest.raises(sqlite3.OperationalError):
            db_manager.execute("INSERT INTO DefinitelyMissing (id) VALUES (?)", ["broken"])

    assert "Database statement execution failed." in caplog.text
    assert "DefinitelyMissing" in caplog.text


def test_commit_transaction_logs_and_raises_failures(app, caplog):
    with app.app_context():
        caplog.set_level(logging.ERROR, logger=app.logger.name)
        conn = db_manager.start_transaction()
        conn.close()

        try:
            with pytest.raises(sqlite3.ProgrammingError):
                db_manager.commit_transaction(conn)
        finally:
            try:
                conn.close()
            except sqlite3.ProgrammingError:
                pass

    assert "Database transaction commit failed." in caplog.text
