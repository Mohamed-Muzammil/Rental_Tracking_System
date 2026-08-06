import psycopg2
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env.local'))

password = "#Muzammil172005"
host = "db.uarhpjkjudlectbsvzki.supabase.co"
port = "5432"
dbname = "postgres"
user = "postgres"

try:
    conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host, port=port)
    conn.autocommit = True
    cursor = conn.cursor()
    
    sql = """
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS description text;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS overdue_amount numeric not null default 0;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS fine_amount numeric not null default 0;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS paid_fines numeric not null default 0;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_history jsonb not null default '[]';
    
    ALTER TABLE equipment ADD COLUMN IF NOT EXISTS current_location jsonb;
    """
    cursor.execute(sql)
    print("Schema altered successfully!")
    
except Exception as e:
    print(f"Failed to run alter: {e}")
finally:
    if 'conn' in locals() and conn:
        cursor.close()
        conn.close()
