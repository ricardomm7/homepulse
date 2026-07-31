import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "homepulse.db")

def get_db_connection():
    # check_same_thread=False is needed because FastAPI routes run in different threads
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS network_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            status BOOLEAN NOT NULL
        )
    ''')
    
    # Adicionar coluna se não existir
    try:
        cursor.execute("ALTER TABLE network_logs ADD COLUMN interface_name TEXT")
    except sqlite3.OperationalError:
        pass # A coluna já existe

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS speedtest_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            download_mbps REAL,
            upload_mbps REAL,
            ping_ms REAL,
            interface_name TEXT,
            interface_max_speed_mbps REAL
        )
    ''')
    conn.commit()
    conn.close()
