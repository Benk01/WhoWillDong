# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from datetime import datetime
from datetime import timedelta
import pickle
from firebase_functions import scheduler_fn
import numpy as np
import pandas as pd
from firebase_admin import initialize_app, firestore
from supabase import create_client, Client
import statsapi
from sklearn.linear_model import LogisticRegression
import pybaseball


initialize_app()

TEAM_ABR_DICT = {
    "Arizona Diamondbacks": "ARI",
    "Atlanta Braves": "ATL",
    "Baltimore Orioles": "BAL",
    "Boston Red Sox": "BOS",
    "Chicago Cubs": "CHC",
    "Chicago White Sox": "CHW",
    "Cincinnati Reds": "CIN",
    "Cleveland Guardians": "CLE",
    "Colorado Rockies": "COL",
    "Detroit Tigers": "DET",
    "Miami Marlins": "MIA",
    "Houston Astros": "HOU",
    "Kansas City Royals": "KAN",
    "Los Angeles Angels": "LAA",
    "Los Angeles Dodgers": "LAD",
    "Milwaukee Brewers": "MIL",
    "Minnesota Twins": "MIN",
    "New York Mets": "NYM",
    "New York Yankees": "NYY",
    "Oakland Athletics": "OAK",
    "Philadelphia Phillies": "PHI",
    "Pittsburgh Pirates": "PIT",
    "San Diego Padres": "SD",
    "San Francisco Giants": "SF",
    "Seattle Mariners": "SEA",
    "St. Louis Cardinals": "STL",
    "Tampa Bay Rays": "TB",
    "Texas Rangers": "TEX",
    "Toronto Blue Jays": "TOR",
    "Washington Nationals": "WAS"
}

TEAM_HR_FACTOR_DICT = {
"CIN": 131,
"LAD": 122,
"NYY": 116,
"PHI": 113,
"LAA": 112,
"TEX": 111,
"ATL": 111,
"MIL": 109,
"COL": 108,
"WSH": 107,
"WAS": 107,
"CHC": 106,
"BAL": 104,
"CWS": 104,
"CHW": 104,
"TOR": 104,
"MIN": 104,
"HOU": 101,
"BOS": 99,
"SEA": 98,
"NYM": 95,
"TB": 94,
"TBR": 94,
"SD": 93,
"SDP": 93,
"STL": 90,
"CLE": 89,
"MIA": 86,
"KC": 84,
"KAN": 84,
"AZ": 84,
"ARI": 84,
"SF": 84,
"SFG": 84,
"OAK": 84,
"PIT": 80,
"DET":79
}

url: str = "https://uamwlolsfoeahksiadjn.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhbXdsb2xzZm9lYWhrc2lhZGpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMzIyODI3NywiZXhwIjoyMDI4ODA0Mjc3fQ.Mxc4mikuAwHf1qEuv4p2u4Uhw26qappHlRJn4S9Km9s"
supabase: Client = create_client(url, key)
db = firestore.client()

def get_player_info_from_api(player_id):
    params = {
        "personId": player_id,
        "hydrate": "currentTeam",
    }
    r = statsapi.get("person", params=params)
    return r

def updatePlayerInfo(player_ids):
    print("checking player info for", len(player_ids), "players...")
    index = 0
    for player_id in player_ids:
        index += 1
        try:
            data, error = supabase.table('Player_Info').select('Player_ID').eq('Player_ID', player_id).single().execute()
            print("Found player", str(index), "/", str(len(player_ids)))
        except:
            print("Player "+ str(player_id) + " not found. Running Repair...")
            # If no data found, proceed to insert
            try:
                player_info = get_player_info_from_api(player_id)
                print(player_info)
                bat_side = player_info["people"][0]['batSide']['code']
                pitch_hand = player_info["people"][0]['pitchHand']['code']
                team_abr = TEAM_ABR_DICT.get(player_info["people"][0]["currentTeam"]["name"], "N/A")
                full_name = player_info["people"][0]["fullName"]
                supabase.table('Player_Info').insert({'Player_ID': player_id, 'Team_Abr': team_abr, 'Full_Name': full_name, 'Bat_Side': bat_side, "Pitch_Hand": pitch_hand}).execute()
                print("Player " + full_name + " successfully inserted")
            except:
                print("New player entry could not be inserted")

# Define the function to query stats for a player's past n at-bats
def mult_batting_records(player_ids):
    # Retrieve Statcast data for the player
    data, count = supabase.table('Events').select("*").in_('batter', player_ids).execute()
    events_data = pd.DataFrame(data[1])
    return events_data[['batter', 'events', 'stand', 'hit_distance_sc', 'launch_speed', 'launch_angle', 'game_date']]

def mult_pitching_records(player_ids):
    # Retrieve Statcast data for the player
    data, count = supabase.table('Events').select("*").in_('pitcher', player_ids).execute()
    events_data = pd.DataFrame(data[1])
    return events_data[['pitcher', 'events', 'p_throws', 'hit_distance_sc', 'launch_speed', 'launch_angle', 'game_date']]


def clean_pitcher_stats(stats):
    plate_appearences = str(len(stats))
    stats = stats.mask(stats.astype(object).eq('')).dropna()
    stats['hit_distance_sc'] = stats.loc[:, 'hit_distance_sc'].astype(float)
    stats['launch_speed'] = stats.loc[:, 'launch_speed'].astype(float)
    stats['launch_angle'] = stats.loc[:, 'launch_angle'].astype(float)
    barely_misses = len(stats[(stats['hit_distance_sc'] > 370) & (stats['events'] != 'home_run')])    
    average_exit_velo = stats.loc[:, 'launch_speed'].mean()
    exit_velo_over_avg = stats[stats['launch_speed'] >= average_exit_velo]
    ev50 = exit_velo_over_avg.loc[:, 'launch_speed'].mean()
    home_runs = len(stats[stats['events'] == 'home_run'])
    return pd.DataFrame({"pitcher": int(stats['pitcher'].iloc[0]), "p_home_runs_L" + plate_appearences: home_runs, "p_average_exit_velo_L" + plate_appearences: average_exit_velo, "p_barely_misses_L" + plate_appearences: barely_misses}, index=[0])

def clean_home_run_stats(stats):
    ten_days_ago = datetime.now() - timedelta(days=10)
    stats['game_date'] = pd.to_datetime(stats['game_date'])
    home_runs_2024 = len(stats[(stats['events'] == 'home_run') & (stats['game_date'].dt.year == 2024)])
    home_runs_2023 = len(stats[(stats['events'] == 'home_run') & (stats['game_date'].dt.year == 2023)])
    home_runs_last10 = len(stats[(stats['events'] == 'home_run') & (stats['game_date'] >= ten_days_ago)])
    return pd.DataFrame({'batter': int(stats['batter'].iloc[0]), 'home_runs_2024': home_runs_2024, 'home_runs_2023': home_runs_2023, 'home_runs_last10': home_runs_last10}, index=[0])

def clean_batter_stats(stats):
    plate_appearences = str(len(stats))
    stats = stats.mask(stats.astype(object).eq('')).dropna()
    stats['hit_distance_sc'] = stats.loc[:, 'hit_distance_sc'].astype(float)
    stats['launch_speed'] = stats.loc[:, 'launch_speed'].astype(float)
    stats['launch_angle'] = stats.loc[:, 'launch_angle'].astype(float)
    barely_misses = len(stats[(stats['hit_distance_sc'] > 370) & (stats['events'] != 'home_run')])
    average_exit_velo = stats.loc[:, 'launch_speed'].mean()
    exit_velo_over_avg = stats[stats['launch_speed'] >= average_exit_velo]
    ev50 = exit_velo_over_avg.loc[:, 'launch_speed'].mean()
    home_runs = len(stats[stats['events'] == 'home_run'])
    return pd.DataFrame({"batter": int(stats['batter'].iloc[0]), "b_home_runs_L" + plate_appearences: home_runs, "b_average_exit_velo_L" + plate_appearences: average_exit_velo, "b_ev50_L" + plate_appearences: ev50, "b_barely_misses_L" + plate_appearences: barely_misses}, index=[0])


def calc_player_data(events_data):
    final_data = events_data
    plate_appearences_set = [270]
    # total batting records of every player_id
    total_batting_record = mult_batting_records(events_data['batter'])
    total_pitching_record = mult_pitching_records(events_data['pitcher'])
    for i in plate_appearences_set:
        cleaned_batter_stats = total_batting_record.groupby('batter').apply(
            lambda group: pd.concat([clean_batter_stats(group[:i])])
            if group.shape[0] >= plate_appearences_set[0]
            else pd.DataFrame()
        ).reset_index(drop=True)
        cleaned_pitcher_stats = total_pitching_record.groupby('pitcher').apply(
            lambda group: pd.concat([clean_pitcher_stats(group[:i])])
            if group.shape[0] >= plate_appearences_set[0]
            else pd.DataFrame({"pitcher": int(group['pitcher'].iloc[0]), "p_home_runs_L270": 11, "p_average_exit_velo_L270": 89.4, "p_barely_misses_L270": 7}, index=[0]) if i == 270
            else pd.DataFrame()
        ).reset_index(drop=True)
        cleaned_batter_stats['batter'] = cleaned_batter_stats['batter'].replace(r'\.0$', '', regex=True).astype(np.int64)
        cleaned_pitcher_stats['pitcher'] = cleaned_pitcher_stats['pitcher'].replace(r'\.0$', '', regex=True).astype(np.int64)
        final_data = pd.merge(cleaned_batter_stats, final_data, left_on='batter', right_on='batter')
        final_data = pd.merge(cleaned_pitcher_stats, final_data, left_on='pitcher', right_on='pitcher')
    print(total_batting_record)
    home_run_stats = total_batting_record.groupby('batter').apply(lambda group: pd.concat([clean_home_run_stats(group[:2000])])).reset_index(drop=True)
    home_run_stats['batter'] = home_run_stats['batter'].replace(r'\.0$', '', regex=True).astype(np.int64)
    final_data = pd.merge(home_run_stats, final_data, left_on='batter', right_on='batter')
    print(final_data)
    print(final_data.columns)
    # final_data['batter'] = final_data['batter'].replace(r'\.0$', '', regex=True).astype(np.int64)
    # final_data['pitcher'] = final_data['pitcher'].replace(r'\.0$', '', regex=True).astype(np.int64)
    # final_data = pd.merge(final_data, total_pitcher_info, left_on='pitcher', right_on='Player_ID')
    # final_data = final_data.drop('Player_ID', axis=1)
    # final_data = pd.merge(final_data, total_batter_info, left_on='batter', right_on='Player_ID')
    return final_data

def transform_date(date_string):
    date_obj = datetime.strptime(date_string, "%Y-%m-%d").date()
    return date_obj.strftime("%Y-%m-%d") 


@scheduler_fn.on_schedule(schedule="every hour")
def test(event: scheduler_fn.ScheduledEvent):
    todays_date = datetime.now() - timedelta(hours=4)
    yesterdays_date = todays_date - timedelta(days=1)

    # 1.) Update statcast with latest data
    statcast_data = pybaseball.statcast(start_dt='2024-04-15', end_dt=todays_date.strftime('%Y-%m-%d'))
    filtered_df = statcast_data[(statcast_data['game_type'] == 'R') & (statcast_data['events'].notna())]
    filtered_df = filtered_df.replace({np.nan: None})
    filtered_df = filtered_df[['pitcher', 'batter', 'game_date', 'events', 'p_throws', 'stand', 'hit_distance_sc', 'launch_speed', 'launch_angle']]
    filtered_df['game_date'] = filtered_df['game_date'].astype(str).apply(transform_date)
    filtered_df['index'] = filtered_df.groupby('game_date').cumcount()
    first_column = filtered_df.pop('index') 
    filtered_df.insert(0, 'index', first_column) 
    list_of_dicts = filtered_df.to_dict('records')
    try:
        supabase.table('Events').upsert(list_of_dicts).execute()
        print('statcast events have been updated')
    except:
        print('statcast events could not be updated')

    # 2.) Build daily target players
    # Take players with >=25 Ab's in the last week
    date_threshold = todays_date - timedelta(days=10)
    date_threshold_str = date_threshold.strftime('%Y-%m-%d')
    data, count = supabase.table('Events').select("*").gte('game_date', date_threshold_str).execute()
    df = pd.DataFrame(data[1])
    df = df.groupby('batter').filter(lambda x: len(x) >= 25)
    df['batter'] = df.loc[:, 'batter'].astype(str)
    player_id_list = df['batter'].unique().tolist()
    # Check to see if all players are in Player_Info, otherwise update
    print("Found", len(player_id_list), "batters that match the criteria for target batters list")
    print("Skipping batter player_info update")
    #updatePlayerInfo(player_id_list)
    data, count = supabase.table('Player_Info').select("*").in_('Player_ID', player_id_list).execute()
    player_info = pd.DataFrame(data[1])
    player_info['Player_ID'] = player_info.loc[:, 'Player_ID'].astype(object)
    
    # 3.) Get today's schedule and starting pitchers
    sched = statsapi.schedule(date=todays_date.strftime('%Y-%m-%d'))
    df = pd.DataFrame(sched)
    df['game_datetime'] = df['game_datetime'].apply(lambda dt: datetime.strptime(dt.replace("T", ' ').replace("Z", ""), '%Y-%m-%d %H:%M:%S'))
    df['game_datetime'] = df['game_datetime'].apply(lambda dt: dt - timedelta(hours=4))
    df['home_name'] = df['home_name'].apply(lambda x: TEAM_ABR_DICT.get(x, x))
    df['away_name'] = df['away_name'].apply(lambda x: TEAM_ABR_DICT.get(x, x))
    home_df = df[['game_datetime', 'away_probable_pitcher_id', 'home_name', 'home_name', 'away_name']]
    away_df = df[['game_datetime', 'home_probable_pitcher_id', 'away_name', 'home_name', 'home_name']]
    home_df.columns = ['game_datetime', 'opposing_probable_pitcher_id','team_name', 'home_name', 'versus']
    away_df.columns = ['game_datetime', 'opposing_probable_pitcher_id','team_name', 'home_name', 'versus']
    reconstructed_df = pd.concat([home_df, away_df], ignore_index=True)
    # Double headers drop the second game!
    reconstructed_df = reconstructed_df.drop_duplicates(subset='team_name', keep='first')
    merged_df = pd.merge(player_info, reconstructed_df, left_on=['Team_Abr'], right_on=['team_name'])
    merged_df = merged_df.drop('team_name', axis=1)
    merged_df = merged_df.drop('Pitch_Hand', axis=1)
    merged_df['opposing_probable_pitcher_id'] = merged_df['opposing_probable_pitcher_id'].replace('', '000000')
    unique_pitcher_id_list = merged_df['opposing_probable_pitcher_id'].unique().tolist()
    print("Found", len(unique_pitcher_id_list), "unique pitchers")
    print("Skipping pitcher player_info update")
    #updatePlayerInfo(unique_pitcher_id_list)
    merged_df = merged_df.rename(columns={'Player_ID': 'batter', 'Team_Abr': 'batter_abr', 'Full_Name': 'batter_name', 'Bat_Side': 'stand', })
    data, count = supabase.table('Player_Info').select("*").in_('Player_ID', unique_pitcher_id_list).execute()
    pitcher_info = pd.DataFrame(data[1])
    pitcher_info['Player_ID'] = pitcher_info.loc[:, 'Player_ID'].astype(object)
    merged_df['opposing_probable_pitcher_id'] = merged_df.loc[:, 'opposing_probable_pitcher_id'].astype(object)
    final_df = pd.merge(merged_df, pitcher_info, left_on=['opposing_probable_pitcher_id'], right_on=['Player_ID'])

    # 4.) Reformat data for model
    final_df = final_df.rename(columns={'Player_ID': 'pitcher', 'versus': 'pitcher_abr', 'Full_Name': 'pitcher_name', 'Pitch_Hand': 'p_throws', })
    final_df = final_df.drop(columns=['Bat_Side', 'opposing_probable_pitcher_id', 'Team_Abr'])
    final_df['is_platoon_match'] = np.where((final_df['stand'] != final_df['p_throws']), 
                            1.0, 
                            0.0)
    final_df['park_factor'] = final_df['home_name'].map(TEAM_HR_FACTOR_DICT)
    final_df = final_df.drop('home_name', axis=1)

    # 5.) Get player_data
    final_data = calc_player_data(final_df)

    # 6.) Test Model and output results to Firebase
    model_pkl_file = "wid_model.pkl"  
    with open(model_pkl_file, 'rb') as file:  
        reg : LogisticRegression = pickle.load(file)

    # features
    x = final_data.drop(['batter', 'pitcher', 'pitcher_name', 'batter_name', 'batter_abr', 'pitcher_abr', 'game_datetime', 'stand', "p_throws", 'home_runs_2024', 'home_runs_2023', 'home_runs_last10'], axis=1)
    dropped_columns_test = final_data[['batter', 'pitcher', 'pitcher_name', 'batter_name', 'batter_abr', 'pitcher_abr', 'game_datetime', 'stand', 'p_throws', 'home_runs_2024', 'home_runs_2023', 'home_runs_last10']].loc[x.index]
    pred_proba = reg.predict_proba(x)
    result_df = pd.DataFrame(pred_proba, columns=[f'Probability_class_{i}' for i in range(pred_proba.shape[1])], index=x.index)
    result_df = pd.concat([result_df, dropped_columns_test], axis=1)
    # Concatenate the DataFrames horizontally
    doc_ref = db.collection('Playerset').document(todays_date.strftime('%Y-%m-%d'))
    doc = doc_ref.get()
    # If daily playset is already created, look to update to latest data. If not created yet, create new daily playerset
    if doc.exists:
        print("Document exists")
        doesDocumentExist = True
    else:
        print("Document does not exist")
        doc_ref.set({"placeholder": True})
        doesDocumentExist = False

    result_df = result_df.sort_values('Probability_class_1', ascending=False).head(65)

    if not doesDocumentExist:
        if len(result_df) >= 50:
            print("Creating sample of n=50")
            result_df = result_df.sample(n=50)

    # Export the DataFrame to Firebase
    for row in result_df.to_dict(orient='records'):
        doc_ref =  db.collection('Playerset').document(todays_date.strftime('%Y-%m-%d')).collection('Players').document(str(row['batter']))
        doc = doc_ref.get()
        if not doesDocumentExist:
            doc_ref.set(row)
            print("Document added.")
        elif doc.exists:
        # The document exists, update it
            doc_ref.update(row)
            print("Document updated.")
        else:
        # The document does not exist, do nothing
            print("No update performed, document does not exist.")