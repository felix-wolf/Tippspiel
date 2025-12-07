import src.chrome_manager as chrome_manager
import inquirer
from src.models.event import Event
from src.database import db_manager
from main import create_app
from selenium.webdriver.common.by import By

def select_game():
    sql = f"SELECT * FROM GAMES;"
    games = db_manager.query(sql)
    choices = [game['name'] for game in games]
    questions = [
        inquirer.List(
            name="game",
            message= 'Select Game',
            choices=choices
        )
    ]
    answers = inquirer.prompt(questions)
    return games[choices.index(answers['game'])]

def get_events(game):
    sql = f"SELECT id FROM EVENTS WHERE game_id = ? and url IS NULL ORDER BY datetime ASC;"
    event_ids = db_manager.query(sql, [game['id']])
    events = []
    for id_dict in event_ids:
        event = Event.get_by_id(id_dict['id'])  # Fetch the full event details
        events.append(event)
    return events

def add_event_urls(events):
    url = "https://www.realbiathlon.com/races.html"
    events_with_url = events
    try:
        driver = chrome_manager.configure_driver()
        driver.implicitly_wait(3)
        driver.get(url)
        back_button = driver.find_element(by=By.XPATH, value='//*[@id="Previousbutton2"]')
        next_button = driver.find_element(by=By.XPATH, value='//*[@id="Nextbutton2"]')
        next_button.click()
        back_button.click()
        event_url = None
        while True:
            # sleep for 5 seconds to allow page to load
            from time import sleep
            sleep(0.5)
            if event_url is not None and event_url == driver.current_url:
                break
            event_url = driver.current_url
            event_name = driver.find_element(by=By.XPATH, value="/html/body/div[1]/nav/div/div[2]/h4").get_attribute('innerHTML').strip()
            # find matching event and set event_url
            for event in events_with_url:
                if event.name == event_name.replace("|","-"):
                    event.url = event_url
                    break
            next_button.click()
        return events_with_url
    except Exception as exc:
        print("Error occurred while adding event URLs:", exc)
        return events

# main method
if __name__ == "__main__":
    app = create_app("prod")

    with app.app_context():
        game = select_game()
        events = get_events(game)
        events = add_event_urls(events)
        print(f"Updating {len(events)} events...")
        for event in events:
            if event.url is not None:
                print(f"Updating Event: {event.name} with URL: {event.url}")
                event.update(
                    name=event.name,
                    event_type_id=event.event_type.id,
                    dt=event.dt,
                    num_bets=event.num_bets,
                    points_correct_bet=event.points_correct_bet,
                    allow_partial_points=event.allow_partial_points,
                    url=event.url
                    )
            else:
                print(f"Event not found in the provided data: {event.name}")
        print("Update completed.")
