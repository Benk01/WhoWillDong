# Required packages
import requests
from bs4 import BeautifulSoup
import pandas as pd

PROB_PITCHERS_TEAM_ABR_TRANSLATE = {
    "SDP": "SD",
    "SFG": "SF",
    "KCR": "KAN",
    "TBR": "TB",
    "WSN": "WAS"
}

def check_key(string):
    if string in PROB_PITCHERS_TEAM_ABR_TRANSLATE:
        return PROB_PITCHERS_TEAM_ABR_TRANSLATE[string]
    else:
        return string
    # Make request to baseball-reference webpage
def todays_probable_starters():
    url = 'https://www.baseball-reference.com/previews/index.shtml'
    response = requests.get(url)

    # Create soup object
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find all the game summary elements
    game_summaries = soup.find_all('div', class_='game_summary nohover')

    # Create empty lists for storing data
    teams = []
    starters = []
    starter_ids = []

    # Loop through each game summary element and extract the data
    for game in game_summaries:
        team_tags = game.find_all('strong')
        if (len(team_tags) == 0):
            continue
        team1 = team_tags[0].text.strip()
        if (team_tags[1].text.strip() != 'MLB Debut'):
            team2 = team_tags[1].text.strip()
        else:
            team2 = team_tags[2].text.strip()
        
        starter_tags = game.find_all('table')[1].find_all('a')
        starter1_tag = starter_tags[1]
        starter2_tag = starter_tags[0]

        
        starter1 = starter1_tag.text.strip()
        starter2 = starter2_tag.text.strip()
        
        if starter1_tag.find_next_sibling().text.strip() == "MLB Debut":
            starter1 = starter1 + " (MLB Debut)"
            
        if starter2_tag.find_next_sibling().text.strip() == "MLB Debut":
            starter2 = starter2 + " (MLB Debut)"
        
        starter_id1 = starter1_tag['href'].split('/')[-1].split('.')[0]
        starter_id2 = starter2_tag['href'].split('/')[-1].split('.')[0]

        if starter_id1 == 'MLB Debut':
            starter_id1 = ""
        
        if starter_id2 == 'MLB Debut':
            starter_id2 = ""
        
        team1 = check_key(team1)
        team2 = check_key(team2)
        teams.extend([team1, team2])
        starters.extend([starter1, starter2])
        starter_ids.extend([starter_id1, starter_id2])

    # Create dataframe from extracted data
    return pd.DataFrame({
        'Starter': starters,
        'Starter_ID': starter_ids,
        'Versus': teams,
    })
