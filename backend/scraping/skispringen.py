import pandas as pd
import csv


def scrape_data():
    df = pd.read_html("https://www.vierschanzentournee.com/de/ergebnisse/gesamtstand")[0]
    df = df["Name"]
    names = df.values
    with open('skispringen_athletes.csv', 'w', newline='') as csvfile:
        spamwriter = csv.writer(csvfile, delimiter=';')
        for name in names:
            splitted = name.split()
            first_names = " ".join(splitted[0:-1])
            last_name = str(splitted[-1])
            spamwriter.writerow([last_name, first_names, 'GER', 'm', 'skispringen'])


if __name__ == '__main__':
    scrape_data()
