import pandas as pd

# ==========================
# 1. DÉTECTION DES UNITÉS
# ==========================

def detect_unit(col_name: str) -> str:
    name = col_name.lower()

    if "%" in name or "pct" in name or "rendement" in name:
        return "%"
    if "tonnage" in name or "métal" in name or "metal" in name or "_t" in name or name.endswith(" t"):
        return "T"
    if "kg" in name:
        return "kg"
    if "g/l" in name:
        return "g/L"
    if "kwh" in name or "energie" in name:
        return "kWh"

    return "Autres"


# ==========================
# 2. COLONNES NUMÉRIQUES
# ==========================

def get_numeric_columns(df: pd.DataFrame) -> list:
    numeric_columns = []
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]) or str(col).startswith("col_"):
            continue

        converted = pd.to_numeric(df[col], errors="coerce")
        if converted.notna().sum() > 0:
            df[col] = converted
            numeric_columns.append(col)
            
    return numeric_columns


# ==========================
# 3. GENERATION DES KPIS
# ==========================

def generate_kpis(df: pd.DataFrame) -> dict:
    kpis = {}
    numeric_columns = get_numeric_columns(df)
    columns = list(df.columns)

    for col in numeric_columns:
        # Ne pas générer de carte KPI indépendante pour les colonnes F1
        if "F1" in col or col.endswith("_F1"):
            continue

        series = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(series) == 0:
            continue

        current = float(series.iloc[-1])
        previous = float(series.iloc[-2]) if len(series) > 1 else current
        trend = current - previous
        average = float(series.mean())
        total = float(series.sum())

        is_volume = any(
            keyword in col.lower()
            for keyword in ["tonnage", "production", "volume", "métal", "metal", "_t"]
        )

        # Recherche de l'objectif F1 associé (colonne F1 située immédiatement après 'col')
        target_f1 = None
        col_idx = columns.index(col)
        if col_idx + 1 < len(columns):
            next_col = columns[col_idx + 1]
            if "F1" in next_col or next_col.endswith("_F1"):
                f1_series = pd.to_numeric(df[next_col], errors="coerce").dropna()
                if not f1_series.empty:
                    target_f1 = round(float(f1_series.iloc[-1]), 2)

        kpis[col] = {
            "value": round(current, 2),
            "average": round(average, 2),
            "sum": round(total, 2),
            "trend": round(trend, 2),
            "target_f1": target_f1,
            "unit": detect_unit(col),
            "type": "volume" if is_volume else "moyenne"
        }

    return kpis


# ==========================
# 4. GENERATION DES GRAPHIQUES (Par Colonne & Par Unité)
# ==========================

def generate_charts(df: pd.DataFrame) -> list:
    charts = []

    if "Date" not in df.columns:
        return charts

    date_series = df["Date"].astype(str).tolist()
    groups = {}

    for col in df.columns:
        if col == "Date" or col.startswith("col_") or "F1" in col:
            continue

        # Extraction du nom de la Colonne Principale (Category) et de la Sous-Colonne
        parts = str(col).split("_")
        if len(parts) > 1:
            category = " ".join(parts[:-1])
            sub_name = parts[-1]
        else:
            category = "Général"
            sub_name = col

        unit = detect_unit(col)

        # Clé unique pour isoler la Colonne ET l'Unité (séparation stricte du % et des valeurs)
        key = f"{category}|{unit}"

        if key not in groups:
            groups[key] = {
                "category": category,
                "unit": unit,
                "columns": []
            }

        groups[key]["columns"].append({
            "fullName": col,
            "subName": sub_name
        })

    # Construction de la structure des séries pour ECharts
    for key, group_data in groups.items():
        series_list = []

        for item in group_data["columns"]:
            col_name = item["fullName"]
            values = pd.to_numeric(df[col_name], errors="coerce").fillna(0).tolist()

            series_list.append({
                "name": item["subName"],
                "fullName": col_name,
                "data": values
            })

        if series_list:
            charts.append({
                "category": group_data["category"],
                "title": f"{group_data['category']} ({group_data['unit']})",
                "unit": group_data["unit"],
                "isPercent": group_data["unit"] == "%",
                "type": "line",
                "xAxis": date_series,
                "series": series_list
            })

    return charts


# ==========================
# 5. OBJECTIFS F1 (Liaison Stricte)
# ==========================

def generate_objectives(df: pd.DataFrame) -> list:
    objectives = []
    columns = list(df.columns)

    if "Date" not in df.columns:
        return objectives

    date_series = df["Date"].astype(str).tolist()

    for i, col in enumerate(columns):
        # Repérer une colonne F1 et la lier STRICTEMENT à la colonne juste avant elle (i - 1)
        if ("F1" in col or col.endswith("_F1")) and i > 0:
            previous_col = columns[i - 1]

            real_values = pd.to_numeric(df[previous_col], errors="coerce").fillna(0).tolist()
            f1_values = pd.to_numeric(df[col], errors="coerce").fillna(0).tolist()

            parts_real = str(previous_col).split("_")
            category = " ".join(parts_real[:-1]) if len(parts_real) > 1 else "Général"
            real_sub_name = parts_real[-1] if len(parts_real) > 1 else previous_col

            parts_f1 = str(col).split("_")
            f1_sub_name = parts_f1[-1] if len(parts_f1) > 1 else col

            unit = detect_unit(previous_col)

            objectives.append({
                "category": category,
                "real_metric": previous_col,
                "real_sub_name": real_sub_name,
                "objective_metric": col,
                "objective_sub_name": f1_sub_name,
                "unit": unit,
                "isPercent": unit == "%",
                "xAxis": date_series,
                "series": [
                    {
                        "name": f"Réel ({real_sub_name})",
                        "data": real_values
                    },
                    {
                        "name": f"Objectif ({f1_sub_name})",
                        "data": f1_values
                    }
                ]
            })

    return objectives


# ==========================
# 6. PAYLOAD D'EXPORT GLOBAL
# ==========================

def build_dashboard(df: pd.DataFrame) -> dict:
    return {
        "kpis": generate_kpis(df),
        "charts": generate_charts(df),
        "objectives": generate_objectives(df)
    }