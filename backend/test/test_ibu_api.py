from datetime import datetime
from xml.etree import ElementTree

from src.ibu_api import IbuApiClient, IbuAthleteRow, IbuResultRow, IbuResultsResponse, race_is_importable


class _FakeResponse:
    def __init__(self, text):
        self.text = text

    def raise_for_status(self):
        return None


class _FakeSession:
    def __init__(self, responses):
        self.responses = responses

    def get(self, url, params=None, timeout=None):
        key = (url.rsplit("/", 1)[-1], tuple(sorted((params or {}).items())))
        return _FakeResponse(self.responses[key])


def test_get_races_for_season_combines_events_and_competitions():
    session = _FakeSession(
        {
            (
                "Events",
                (("Level", 1), ("SeasonId", "2526")),
            ): """
                <ArrayOfEvent>
                  <Event>
                    <EventId>BT2526SWRLCP03</EventId>
                    <ShortDescription>Oberhof</ShortDescription>
                    <Nat>GER</Nat>
                  </Event>
                </ArrayOfEvent>
            """,
            (
                "Competitions",
                (("EventId", "BT2526SWRLCP03"),),
            ): """
                <ArrayOfCompetition>
                  <Competition>
                    <RaceId>BT2526SWRLCP03SWMS</RaceId>
                    <ShortDescription>Women Mass Start</ShortDescription>
                    <StartTime>2026-01-11T14:45:00Z</StartTime>
                    <Gender>W</Gender>
                    <Location>Oberhof</Location>
                    <Discipline>Mass Start</Discipline>
                  </Competition>
                </ArrayOfCompetition>
            """,
            ("Events", (("Level", 2), ("SeasonId", "2526"))): "<ArrayOfEvent />",
            ("Events", (("Level", 3), ("SeasonId", "2526"))): "<ArrayOfEvent />",
            ("Events", (("Level", 4), ("SeasonId", "2526"))): "<ArrayOfEvent />",
        }
    )
    client = IbuApiClient(session=session)

    races = client.get_races_for_season("2526")

    assert len(races) == 1
    assert races[0].season_id == "2526"
    assert races[0].event_id == "BT2526SWRLCP03"
    assert races[0].race_id == "BT2526SWRLCP03SWMS"
    assert races[0].location == "Oberhof (GER)"
    assert races[0].race_format == "Mass Start"


def test_get_races_for_season_prefers_stop_style_location_over_venue_name():
    session = _FakeSession(
        {
            (
                "Events",
                (("Level", 1), ("SeasonId", "2526")),
            ): """
                [{"EventId":"BT2526SWRLCP08","ShortDescription":"Otepaa","Nat":"EST"}]
            """,
            (
                "Competitions",
                (("EventId", "BT2526SWRLCP08"),),
            ): """
                [{"RaceId":"BT2526SWRLCP08SMSP","ShortDescription":"Men 10km Sprint","StartTime":"2026-03-12T15:15:00Z","Gender":"SM","Location":"Tehvandi Sport Center"}]
            """,
            ("Events", (("Level", 2), ("SeasonId", "2526"))): "[]",
            ("Events", (("Level", 3), ("SeasonId", "2526"))): "[]",
            ("Events", (("Level", 4), ("SeasonId", "2526"))): "[]",
        }
    )
    client = IbuApiClient(session=session)

    races = client.get_races_for_season("2526")

    assert len(races) == 1
    assert races[0].location == "Otepaa (EST)"


def test_get_results_maps_official_rows():
    session = _FakeSession(
        {
            ("Results", (("RaceId", "BT2526SWRLCP03SWMS"),)): """
                <ArrayOfResult>
                  <Result>
                    <Rank>1</Rank>
                    <GivenName>Lou</GivenName>
                    <FamilyName>Jeanmonnot</FamilyName>
                    <IBUId>IBU-123</IBUId>
                    <Nat>FRA</Nat>
                    <Result>39:12.1</Result>
                    <Behind>0.0</Behind>
                    <Shoot1>0</Shoot1>
                    <Shoot2>1</Shoot2>
                    <ShootingTime>1:42.0</ShootingTime>
                  </Result>
                </ArrayOfResult>
            """
        }
    )
    client = IbuApiClient(session=session)

    rows = client.get_results("BT2526SWRLCP03SWMS")

    assert rows == IbuResultsResponse(
        kind="results",
        rows=[
            IbuResultRow(
                rank=1,
                first_name="Lou",
                last_name="Jeanmonnot",
                athlete_id="IBU-123",
                nation_code="FRA",
                country_name=None,
                time="39:12.1",
                behind="0.0",
                shooting="0 1",
                shooting_time="1:42.0",
                status=None,
            )
        ],
        is_start_list=False,
        is_result=True,
    )


def test_get_results_prefers_total_time_over_result_for_absolute_time():
    session = _FakeSession(
        {
            ("Results", (("RaceId", "BT2526SWRLCP03SWMS"),)): """
                <ArrayOfResult>
                  <Result>
                    <Rank>2</Rank>
                    <GivenName>Franziska</GivenName>
                    <FamilyName>Preuss</FamilyName>
                    <IBUId>IBU-456</IBUId>
                    <Nat>GER</Nat>
                    <Result>+12.3</Result>
                    <TotalTime>39:24.4</TotalTime>
                    <Behind>+12.3</Behind>
                  </Result>
                </ArrayOfResult>
            """
        }
    )
    client = IbuApiClient(session=session)

    rows = client.get_results("BT2526SWRLCP03SWMS")

    assert rows == IbuResultsResponse(
        kind="results",
        rows=[
            IbuResultRow(
                rank=2,
                first_name="Franziska",
                last_name="Preuss",
                athlete_id="IBU-456",
                nation_code="GER",
                country_name=None,
                time="39:24.4",
                behind="+12.3",
                shooting=None,
                shooting_time=None,
                status=None,
            )
        ],
        is_start_list=False,
        is_result=True,
    )


def test_get_results_maps_official_status_codes():
    session = _FakeSession(
        {
            ("Results", (("RaceId", "BT2526SWRLCP03SWMS"),)): """
                <ArrayOfResult>
                  <Result>
                    <Rank>DNF</Rank>
                    <GivenName>Lou</GivenName>
                    <FamilyName>Jeanmonnot</FamilyName>
                    <IBUId>IBU-123</IBUId>
                    <Nat>FRA</Nat>
                    <Result>DNF</Result>
                    <Behind>DNF</Behind>
                  </Result>
                </ArrayOfResult>
            """
        }
    )
    client = IbuApiClient(session=session)

    rows = client.get_results("BT2526SWRLCP03SWMS")

    assert rows == IbuResultsResponse(
        kind="results",
        rows=[
            IbuResultRow(
                rank=None,
                first_name="Lou",
                last_name="Jeanmonnot",
                athlete_id="IBU-123",
                nation_code="FRA",
                country_name=None,
                time="DNF",
                behind="DNF",
                shooting=None,
                shooting_time=None,
                status="DNF",
            )
        ],
        is_start_list=False,
        is_result=True,
    )


def test_get_results_classifies_explicit_start_list_payload():
    session = _FakeSession(
        {
            ("Results", (("RaceId", "BT2526SWRLCP08SMSP"),)): """
                {
                    "RaceId": "BT2526SWRLCP08SMSP",
                    "IsStartList": true,
                    "IsResult": false,
                    "Results": [
                        {
                            "ResultOrder": 10001,
                            "IBUId": "BTKAZ12409200001",
                            "GivenName": "Vladislav",
                            "FamilyName": "KIREYEV",
                            "Nat": "KAZ",
                            "StartTime": "2026-03-12T14:15:30Z"
                        }
                    ]
                }
            """
        }
    )
    client = IbuApiClient(session=session)

    response = client.get_results("BT2526SWRLCP08SMSP")

    assert response.kind == "start_list"
    assert response.is_start_list is True
    assert response.is_result is False
    assert response.rows[0].athlete_id == "BTKAZ12409200001"


def test_get_results_classifies_start_list_without_top_level_flags():
    session = _FakeSession(
        {
            ("Results", (("RaceId", "BT2526SWRLCP08SMSP"),)): """
                {
                    "Results": [
                        {
                            "ResultOrder": 10001,
                            "IBUId": "BTKAZ12409200001",
                            "GivenName": "Vladislav",
                            "FamilyName": "KIREYEV",
                            "Nat": "KAZ",
                            "StartTime": "2026-03-12T14:15:30Z"
                        }
                    ]
                }
            """
        }
    )
    client = IbuApiClient(session=session)

    response = client.get_results("BT2526SWRLCP08SMSP")

    assert response.kind == "start_list"
    assert response.rows[0].athlete_id == "BTKAZ12409200001"


def test_get_athletes_maps_official_rows():
    session = _FakeSession(
        {
            ("athletes", (("SeasonId", "2526"),)): """
                <ArrayOfAthlete>
                  <Athlete>
                    <IBUId>IBU-123</IBUId>
                    <GivenName>Lou</GivenName>
                    <FamilyName>Jeanmonnot</FamilyName>
                    <Nat>FRA</Nat>
                    <Gender>W</Gender>
                  </Athlete>
                </ArrayOfAthlete>
            """
        }
    )
    client = IbuApiClient(session=session)

    athletes = client.get_athletes("2526")

    assert athletes == [
        IbuAthleteRow(
            athlete_id="IBU-123",
            first_name="Lou",
            last_name="Jeanmonnot",
            nation_code="FRA",
            gender="W",
        )
    ]


def test_get_athletes_accepts_json_payloads():
    session = _FakeSession(
        {
            ("athletes", (("SeasonId", "2526"),)): """
                {"RequestId":"","Athletes":[{"IBUId":"IBU-123","GivenName":"Lou","FamilyName":"Jeanmonnot","NAT":"FRA","GenderId":"W"}]}
            """
        }
    )
    client = IbuApiClient(session=session)

    athletes = client.get_athletes("2526")

    assert athletes == [
        IbuAthleteRow(
            athlete_id="IBU-123",
            first_name="Lou",
            last_name="Jeanmonnot",
            nation_code="FRA",
            gender="W",
        )
    ]


def test_iter_records_unwraps_single_container():
    root = ElementTree.fromstring(
        """
        <ArrayOfResult>
          <Result>
            <Rank>1</Rank>
          </Result>
          <Result>
            <Rank>2</Rank>
          </Result>
        </ArrayOfResult>
        """
    )

    records = IbuApiClient._iter_records(root)

    assert len(records) == 2
    assert records[0].tag == "Result"


def test_race_is_importable_excludes_old_races():
    from src.ibu_api import IbuRace

    recent_race = IbuRace(
        season_id="2526",
        event_id="event-1",
        race_id="race-1",
        location="Oberhof",
        title="Women Sprint",
        starts_at=datetime(2026, 1, 1, 12, 0, 0),
    )
    old_race = IbuRace(
        season_id="2526",
        event_id="event-2",
        race_id="race-2",
        location="Oberhof",
        title="Men Sprint",
        starts_at=datetime(2025, 12, 20, 12, 0, 0),
    )

    assert race_is_importable(recent_race, now=datetime(2026, 1, 2, 11, 0, 0))
    assert not race_is_importable(old_race, now=datetime(2026, 1, 2, 11, 0, 0))
