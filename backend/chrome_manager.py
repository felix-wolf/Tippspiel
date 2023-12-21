from selenium import webdriver
import os
import platform
from selenium.webdriver.chrome.service import Service
from selenium.common import NoSuchElementException
import pandas as pd
import io


def read_table_into_df(url: str, table_element_value: str, table_element_key: str = 'id'):
    driver = configure_driver()
    driver.implicitly_wait(60)
    driver.get(url)
    try:
        html = io.StringIO(driver.find_element(by=table_element_key, value=table_element_value).get_attribute('outerHTML'))
        return pd.read_html(html)[0]
    except NoSuchElementException as exc:
        return None


# configures the driver by getting the executable etc.
def configure_driver():
    this_path = os.path.dirname(os.path.abspath(__file__))
    driver_dir = str(os.path.abspath(this_path + "/chromedriver"))

    # Start a new instance of the Chrome browser
    options = webdriver.ChromeOptions()
    service = Service(executable_path=driver_dir)
    if platform.system() == "Linux":
        print("is linux")
        options.add_argument('--headless')
        driver = webdriver.Chrome(service=service, options=options)
        return driver
    elif platform.system() == "Darwin":
        print("is mac")
        driver = webdriver.Chrome(options=options)
        return driver
    return None
