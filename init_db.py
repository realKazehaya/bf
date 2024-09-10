import sqlite3

def init_db(db_path='database.db'):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                roblox_username TEXT UNIQUE NOT NULL,
                robux_earned INTEGER DEFAULT 0
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS withdrawals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                roblox_username TEXT NOT NULL,
                amount INTEGER NOT NULL,
                date TEXT NOT NULL
            )
        ''')
        conn.commit()
        print("Database initialized successfully.")
    except sqlite3.Error as e:
        print(f"Error initializing database: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
