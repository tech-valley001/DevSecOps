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

    raw = pd.read_excel(
        file,
        sheet_name=0,
        header=None
    )


    print("\n===== RAW =====")
    print(raw.head(8))


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

            # colonne date
            columns.append("Date")

        elif metric != "":

            if current_group:

                columns.append(
                    current_group + "_" + metric
                )

            else:

                columns.append(metric)

        else:

            columns.append(
                f"col_{i}"
            )



    print("\n===== NOUVELLES COLONNES =====")
    print(columns)



    df = raw.iloc[4:].copy()

    df.columns = columns


    # supprimer les colonnes complètement vides
    df = df.dropna(
        axis=1,
        how="all"
    )


    # convertir la date
    if "Date" in df.columns:

        df["Date"] = pd.to_datetime(
            df["Date"],
            errors="coerce"
        )


    df = df.reset_index(drop=True)


    print("\n===== DATA FINAL =====")
    print(df.head())

    print(df.dtypes)


    return df