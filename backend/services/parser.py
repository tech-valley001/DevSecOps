import pandas as pd

def normalize(text):
    if pd.isna(text):
        return ""
    text = str(text).strip()
    text = text.replace(" ", "_")
    text = text.replace("%", "pct")
    text = text.replace("/", "_")
    text = text.replace("(", "")
    text = text.replace(")", "")
    text = text.replace("\n", "_")
    return text

def load_excel(file):
    # Charger le fichier Excel pour obtenir toutes les feuilles
    xls = pd.ExcelFile(file)
    sheets_data = {}

    for sheet_name in xls.sheet_names:
        print(f"\n===== PARSING SHEET: {sheet_name} =====")
        raw = pd.read_excel(xls, sheet_name=sheet_name, header=None)

        group_row = raw.iloc[2]
        metric_row = raw.iloc[3]

        columns = []
        current_group = ""

        for i in range(len(raw.columns)):
            group = group_row.iloc[i]
            metric = metric_row.iloc[i]

            if pd.notna(group):
                current_group = normalize(group)

            metric = normalize(metric)

            if i == 1:
                # Colonne date
                columns.append("Date")
            elif metric != "":
                if current_group:
                    columns.append(current_group + "_" + metric)
                else:
                    columns.append(metric)
            else:
                columns.append(f"col_{i}")

        df = raw.iloc[4:].copy()
        df.columns = columns

        # Supprimer les colonnes complètement vides
        df = df.dropna(axis=1, how="all")

        # Convertir la date
        if "Date" in df.columns:
            df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

        df = df.reset_index(drop=True)
        sheets_data[sheet_name] = df

    return sheets_data