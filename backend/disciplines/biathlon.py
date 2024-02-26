from models.result import Result
from models.athlete import Athlete
from models.country import Country
import utils


def preprocess_results(url, event, chrome_manager):
    df = chrome_manager.read_table_into_df(url, "thistable")
    if df is None:
        return [], "Fehler beim Parsen der Webseite"

    if event.event_type.betting_on == "countries":
        if "Rank" not in df or "Country" not in df or "Nation" not in df:
            return [], "Webseite enthält nicht die erwarteten Daten"
        df = df[["Rank", "Country", "Nation"]]
        df = df[df["Country"].notnull()]
        results = []
        countries = []
        for r in df.values:
            place = r[0]
            country_name = r[1]
            country_code = r[2]
            r = Result(event_id=event.id, place=utils.validate_int(r[0]), object_id=r[2], object_name=r[1])
            results.append(r)
            c = Country(country_code, country_name, "🏴‍☠️")
            countries.append(c)
        process_countries(countries)
        return results, None

    elif event.event_type.betting_on == "athletes":
        if "Rank" not in df or "Family\xa0Name" not in df or "Given Name" not in df or "Nation" not in df:
            return [], "Webseite enthält nicht die erwarteten Daten"
        df = df[["Rank", "Family\xa0Name", "Given Name", "Nation"]]
        results = []
        athletes = []
        for r in df.values:
            place = r[0]
            last_name = r[1]
            first_name = r[2]
            country_code = r[3]
            a_id = utils.generate_id([last_name, first_name, country_code])
            a_name = " ".join([first_name, last_name])
            r = Result(event_id=event.id, place=utils.validate_int(place), object_id=a_id, object_name=a_name)
            results.append(r)
            a = Athlete(athlete_id=a_id, first_name=first_name, last_name=last_name, country_code=country_code, gender="?", discipline="biathlon")
            athletes.append(a)
        process_athletes(athletes)
        return results, None

    else:
        return [], "Wettobjekt nicht bekannt"


def process_athletes(athletes:[]):
    # find gender
    first_existing_althlete = None
    for a in athletes:
        athlete_from_db = Athlete.find_by_id(a.id)
        if athlete_from_db is not None:
            first_existing_althlete = athlete_from_db
            break

    # save gender to athlete object, write athlete into db
    for a in athletes:
        a.gender = first_existing_althlete.gender
        a.save_to_db()


def process_countries(countries):
    for c in countries:
        c.save_to_db()