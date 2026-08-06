import psycopg2
import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# The password from the user: #Muzammil172005
password = "#Muzammil172005"
host = "db.uarhpjkjudlectbsvzki.supabase.co"
port = "5432"
dbname = "postgres"
user = "postgres"

try:
    print("Connecting to Supabase...")
    conn = psycopg2.connect(
        dbname=dbname,
        user=user,
        password=password,
        host=host,
        port=port
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    migration_file = os.path.join(os.path.dirname(__file__), 'migrations', '001_init_schema.sql')
    print(f"Reading {migration_file}...")
    
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql = f.read()
        
    print("Executing migration script...")
    cursor.execute(sql)
    print("Migration executed successfully!")
    
except Exception as e:
    print(f"Failed to run migration: {e}")
finally:
    if 'conn' in locals() and conn:
        cursor.close()
        conn.close()
