import pandas as pd

def get_numeric_columns(df):
    numeric_columns = []
    for col in df.columns:
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
        
        # Envoie directement la moyenne ou la somme en nombre simple (pas d'objet)
        is_volume = any(k in col.lower() for k in ["tonnage", "production", "soutirée", "volume", "t_"])
        val = series.sum() if is_volume else series.mean()
        kpis[col] = round(float(val), 2)
        
    return kpis

def generate_charts(df):
    charts = []
    date_column = "Date"
    if date_column not in df.columns:
        return charts

    groups = {}
    for col in df.columns:
        if col == date_column or col.startswith("col_") or "F1" in col:
            continue
        
        parts = col.split("_")
        if len(parts) > 1:
            group_name = "_".join(parts[:-2]) if len(parts) > 2 else parts[0]
            group_display = group_name.replace("_", " ")
            if group_display not in groups:
                groups[group_display] = []
            groups[group_display].append(col)
        else:
            if "Autres" not in groups:
                groups["Autres"] = []
            groups["Autres"].append(col)

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
    result = []
    for col in df.columns:
        # Repérer les colonnes d'objectifs (ex: _F1)
        if "F1" in col or col.endswith("_F1"):
            prefix = col.replace("_F1", "").replace(" F1", "").replace("_f1", "")
            
            series_target = pd.to_numeric(df[col], errors="coerce").dropna()
            if not series_target.empty:
                target_val = float(series_target.mean())
                
                # Exporter l'objectif sous forme de métrique directe
                result.append({
                    "metric": col,
                    "target_value": round(target_val, 2)
                })
                result.append({
                    "metric": prefix,
                    "target_value": round(target_val, 2)
                })
                
    return result