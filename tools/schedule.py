import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import datetime, timedelta, time
import pytz  # For timezone handling


def initialize_firestore():
    # Initialize the Firestore client with your service account
    cred = credentials.Certificate('will-it-dong-firebase-adminsdk-vhp63-270695af4a.json')
    firebase_admin.initialize_app(cred)


def add_date_documents():
    db = firestore.client()
    utc_zone = pytz.utc  # UTC Time Zone
    
    # Calculate the current UTC time and normalize it to the start of the day
    base_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=utc_zone)
    
    for i in range(30):  # Generate dates for the next 30 days
        # Create a date object for today + i days in UTC
        date_only = base_date + timedelta(days=i)
        
        # Calculate start and end times in UTC, assuming they represent 1 PM and 11:30 PM Eastern Time respectively
        # Eastern Time is UTC-4/UTC-5 depending on daylight saving, but we're skipping that distinction for simplicity
        start_datetime = date_only.replace(hour=17, minute=0, tzinfo=utc_zone) + timedelta(hours=3)  # Adding 3 hours
        end_datetime = (date_only + timedelta(days=1)).replace(hour=3, minute=30, tzinfo=utc_zone) + timedelta(hours=3)  # Adding 3 hours
        
        # Format the date to YYYY-MM-DD for the document ID
        date_str = date_only.strftime('%Y-%m-%d')
        doc_ref = db.collection('Schedule').document(date_str)
        doc_ref.set({
            'starttime': start_datetime,
            'endtime': end_datetime
        })
        print(f"Document for {date_str} added with start time {start_datetime.isoformat()} and end time {end_datetime.isoformat()}.")

def main():
    initialize_firestore()
    add_date_documents()

if __name__ == '__main__':
    main()