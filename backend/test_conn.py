import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print(f"URL: {SUPABASE_URL}")
print(f"KEY: {'DEFINED' if SUPABASE_KEY else 'NOT DEFINED'}")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing credentials")
    exit(1)

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    res = supabase.table("users").select("count", count="exact").execute()
    print(f"Success! Users count: {res.count}")
except Exception as e:
    print(f"Error connecting: {str(e)}")
