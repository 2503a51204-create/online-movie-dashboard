from pathlib import Path
from flask import Flask, jsonify, send_from_directory
import pandas as pd
import math

# ============================================================
# PATHS
# ============================================================

BASE = Path(__file__).resolve().parent.parent
FRONT = BASE / "frontend"
XLSX = BASE / "data" / "Online_Movie_Platform_Professional_Dataset.xlsx"

# ============================================================
# FLASK APP
# ============================================================

app = Flask(
    __name__,
    static_folder=str(FRONT),
    static_url_path=""
)

# ============================================================
# JSON-SAFE HELPERS
# ============================================================

def clean_value(value):
    """
    Convert Pandas/Excel values into valid JSON values.

    NaN / NaT / missing values -> None
    """
    if pd.isna(value):
        return None

    # Convert NumPy numeric values to normal Python values
    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass

    # Make sure float NaN / infinity never reaches JSON
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None

    return value


def clean_dataframe(df):
    """
    Convert every missing Excel value to None.
    """
    return df.astype(object).where(pd.notna(df), None)


def safe_int(value):
    value = clean_value(value)

    if value is None:
        return None

    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def safe_float(value):
    value = clean_value(value)

    if value is None:
        return None

    try:
        number = float(value)

        if math.isnan(number) or math.isinf(number):
            return None

        return number

    except (ValueError, TypeError):
        return None


def safe_string(value):
    value = clean_value(value)

    if value is None:
        return None

    return str(value)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return send_from_directory(FRONT, "index.html")


# ============================================================
# DASHBOARD API
# ============================================================

@app.get("/api/summary")
def summary():

    # --------------------------------------------------------
    # LOAD EXCEL SHEETS
    # --------------------------------------------------------

    movies = pd.read_excel(
        XLSX,
        sheet_name="Movies"
    )

    users = pd.read_excel(
        XLSX,
        sheet_name="Users"
    )

    streams = pd.read_excel(
        XLSX,
        sheet_name="Streaming_Data"
    )

    # --------------------------------------------------------
    # CLEAN ALL DATAFRAMES
    # This is the important NaN fix.
    # --------------------------------------------------------

    movies = clean_dataframe(movies)
    users = clean_dataframe(users)
    streams = clean_dataframe(streams)

    # --------------------------------------------------------
    # MOVIES
    # --------------------------------------------------------

    movies_data = []

    for _, r in movies.iterrows():

        movie = {
            "id": safe_string(r.get("Movie_ID")),
            "title": safe_string(r.get("Movie_Title")),
            "genre": safe_string(r.get("Genre")),
            "language": safe_string(r.get("Language")),
            "country": safe_string(r.get("Country")),
            "year": safe_int(r.get("Year")),
            "rating": safe_float(r.get("IMDb_Rating")),
            "views": safe_int(r.get("Views")),
            "revenue": safe_float(r.get("Revenue_INR"))
        }

        movies_data.append(movie)

    # --------------------------------------------------------
    # USERS
    # --------------------------------------------------------

    users_data = []

    for record in users.to_dict("records"):

        cleaned_record = {
            key: clean_value(value)
            for key, value in record.items()
        }

        users_data.append(cleaned_record)

    # --------------------------------------------------------
    # STREAMING DATA
    # --------------------------------------------------------

    streams = streams.copy()

    if "Watch_Date" in streams.columns:

        streams["Watch_Date"] = pd.to_datetime(
            streams["Watch_Date"],
            errors="coerce"
        )

        streams["date"] = streams["Watch_Date"].dt.strftime(
            "%Y-%m-%d"
        )

        streams["month"] = streams["Watch_Date"].dt.strftime(
            "%Y-%m"
        )

    streams = clean_dataframe(streams)

    streaming_data = []

    for record in streams.to_dict("records"):

        cleaned_record = {
            key: clean_value(value)
            for key, value in record.items()
        }

        streaming_data.append(cleaned_record)

    # --------------------------------------------------------
    # SAFE SUMMARY CALCULATIONS
    # --------------------------------------------------------

    views = pd.to_numeric(
        movies["Views"],
        errors="coerce"
    ).fillna(0)

    ratings = pd.to_numeric(
        movies["IMDb_Rating"],
        errors="coerce"
    )

    revenue = pd.to_numeric(
        movies["Revenue_INR"],
        errors="coerce"
    ).fillna(0)

    watch_minutes = pd.to_numeric(
        streams["Watch_Minutes"],
        errors="coerce"
    ).fillna(0)

    # --------------------------------------------------------
    # ACTIVE USERS
    # --------------------------------------------------------

    if "Status" in users.columns:

        active_users = int(
            (
                users["Status"]
                .astype(str)
                .str.strip()
                .str.lower()
                == "active"
            ).sum()
        )

    else:
        active_users = 0

    # --------------------------------------------------------
    # RETURN DASHBOARD DATA
    # --------------------------------------------------------

    return jsonify({

        "movies": int(len(movies)),

        "users": int(len(users)),

        "streams": int(len(streams)),

        "views": float(views.sum()),

        "rating": safe_float(ratings.mean()),

        "revenue": float(revenue.sum()),

        "watch_hours": float(
            watch_minutes.sum() / 60
        ),

        "active_users": active_users,

        "movies_data": movies_data,

        "users_data": users_data,

        "streaming_data": streaming_data

    })


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("🎬 CineVerse Professional Movie Dashboard")
    print("=" * 60)
    print(f"📁 Excel: {XLSX}")
    print(f"🌐 Frontend: {FRONT}")
    print("🚀 Starting Flask server...")
    print("=" * 60)

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )