from selenium import webdriver
import os
import platform
from selenium.webdriver.chrome.service import Service


# configures the driver by getting the executable etc.
def configure_driver():
    this_path = os.path.dirname(os.path.abspath(__file__))
    driver_dir = str(os.path.abspath(this_path + "/chromedriver"))

    # Start a new instance of the Chrome browser
    options = webdriver.ChromeOptions()
    service = Service(executable_path=driver_dir)
    options.add_argument('--headless')
    if platform.system() == "Linux":
        print("is linux")
        driver = webdriver.Chrome(service=service, options=options)
        return driver
    elif platform.system() == "Darwin":
        print("is mac")
        driver = webdriver.Chrome(options=options)
        return driver
    return None
