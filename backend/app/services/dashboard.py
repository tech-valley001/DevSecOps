import pandas as pd

def get_numeric_columns(df):
    numeric_columns = []
    for col in df.columns:
        # Ignorer les dates et les colonnes techniques/vides
        if pd.api.types.is_datetime64_any_dtype(df[col]) or col.startswith("col_"):
            continue

        converted = pd.to_numeric(df[col], errors="coerce")
        if converted.notna().sum() > 0:
            df[col] = converted
            numeric_columns.append(col)
    return numeric_columns

def generate_kpis(df):
    kpis = {}
    numeric_columns = get_numeric_columns(df)
    for col in numeric_columns:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        kpis[col] = {
            "sum": float(series.sum()),
            "mean": float(series.mean()),
            "max": float(series.max()),
            "min": float(series.min())
        }
    return kpis

def generate_charts(df):
    charts = []
    date_column = "Date"
    if date_column not in df.columns:
        return charts

    # Génération dynamique des groupes de graphiques basés sur le préfixe avant le premier "_"
    # Exemple : "Concentré_Co_BA_Tonnage_sec" -> Groupe "Concentré Co BA"
    groups = {}
    for col in df.columns:
        if col == date_column or col.startswith("col_") or "F1" in col:
            continue
        
        # Extraire le nom du groupe (ex: "Concentré_Co_BA")
        parts = col.split("_")
        if len(parts) > 1:
            # On prend tout ce qui précède la métrique finale (ex: Tonnage, pct, etc.)
            group_name = "_".join(parts[:-2]) if len(parts) > 2 else parts[0]
            group_display = group_name.replace("_", " ")
            if group_display not in groups:
                groups[group_display] = []
            groups[group_display].append(col)
        else:
            if "Autres" not in groups:
                groups["Autres"] = []
            groups["Autres"].append(col)

    # Création des graphiques linéaires pour chaque groupe identifié
    for group, columns in groups.items():
        series = []
        for col in columns:
            series.append({
                "name": col,
                "data": pd.to_numeric(df[col], errors="coerce").fillna(0).tolist()
            })

        if series:
            charts.append({
                "title": group,
                "type": "line",
                "xAxis": df[date_column].astype(str).tolist(),
                "series": series
            })
    return charts

def generate_objectives(df):
    # Génération dynamique : cherche chaque colonne qui se termine par "_F1"
    # et l'associe à sa mesure correspondante (ex: Concentré_Co_BA_Tonnage_sec vs Concentré_Co_BA_F1)
    result = []
    date_column = "Date"
    if date_column not in df.columns:
        return result

    for col in df.columns:
        if col.endswith("_F1") or col == "Production_F1" or col == "Rendement_Bilan_F1":
            # Trouver la colonne correspondante qui n'est pas l'objectif (F1)
            prefix = col.rsplit("_", 1)[0]  # Récupère "Concentré_Co_BA" ou "Production"
            
            # Chercher une colonne "Tonnage_sec" ou "net" ou "Métal" associée à ce préfixe
            matching_cols = [c for c in df.columns if c.startswith(prefix) and c != col and not c.endswith("_F1")]
            
            if matching_cols:
                target_col = matching_cols[0] # Prendre la première variable associée
                result.append({
                    "title": f"{prefix.replace('_', ' ')} : Réel vs Objectif (F1)",
                    "type": "line",
                    "xAxis": df[date_column].astype(str).tolist(),
                    "series": [
                        {
                            "name": "Réel (" + target_col.split("_")[-1] + ")",
                            "data": pd.to_numeric(df[target_col], errors="coerce").fillna(0).tolist()
                        },
                        {
                            "name": "Objectif (F1)",
                            "data": pd.to_numeric(df[col], errors="coerce").fillna(0).tolist()
                        }
                    ]
                })
    return result