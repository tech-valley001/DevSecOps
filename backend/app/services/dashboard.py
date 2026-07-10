import pandas as pd


def get_numeric_columns(df):

    numeric_columns = []


    for col in df.columns:


        # ignorer les dates

        if pd.api.types.is_datetime64_any_dtype(df[col]):

            continue


        converted = pd.to_numeric(
            df[col],
            errors="coerce"
        )


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


    groups = {


        "Concentré Co BA":[

            "Concentré_Co_BA_Tonnage_sec",

            "Concentré_Co_BA_pct_Co",

            "Concentré_Co_BA_Co_métal_T"

        ],



        "Produit grillé":[

            "Grillé_Produit_Tonnage_sec",

            "Grillé_Produit_pct_Co",

            "Grillé_Produit_Co_métal_T"

        ],



        "Production":[

            "Production_As2O3_net",

            "Production_As2O3_sans_recyclage",

            "Production_Arsenic_Contaminé"

        ],



        "Rendement":[

            "Rendement_Bilan_Rendement_Métal",

            "Rendement_Bilan_Rendement_Poids",

            "Rendement_Bilan_Rendement_de_désarsenificationpct_Prod"

        ]

    }





    for group,columns in groups.items():


        series=[]



        for col in columns:


            if col in df.columns:


                series.append({

                    "name":col,

                    "data":
                    pd.to_numeric(
                        df[col],
                        errors="coerce"
                    )
                    .fillna(0)
                    .tolist()

                })




        if series:


            charts.append({

                "title":group,

                "type":"line",

                "xAxis":
                df[date_column]
                .astype(str)
                .tolist(),


                "series":series

            })



    return charts

def process_vs_objective(df):

    charts = []


    date_column = "Date"


    if date_column not in df.columns:
        return charts


    dates = df[date_column].astype(str).tolist()


    for col in df.columns:


        if "F1" in col:


            f1_values = (
                pd.to_numeric(
                    df[col],
                    errors="coerce"
                )
                .fillna(0)
                .tolist()
            )


            charts.append({

                "title": "Evolution " + col,

                "type": "line",

                "xAxis": dates,

                "series":[
                    {
                        "name": col,
                        "data": f1_values
                    }
                ]

            })


            # rechercher les variables associées

            prefix = col.replace("_F1","")


            related = [

                c for c in df.columns

                if prefix in c

                and c != col

            ]


            for variable in related:


                values = (

                    pd.to_numeric(
                        df[variable],
                        errors="coerce"
                    )

                    .fillna(0)

                    .tolist()

                )


                charts.append({

                    "title":

                    variable +

                    " vs " +

                    col,


                    "type":"bar",


                    "xAxis":dates,


                    "series":[

                        {
                        "name":variable,
                        "data":values
                        },

                        {
                        "name":col,
                        "data":f1_values
                        }

                    ]

                })


    return charts
def generate_objectives(df):


    result=[]



    groups={


    "Concentré Co BA":

    (
    "Concentré_Co_BA_Tonnage_sec",
    "Concentré_Co_BA_F1"
    ),



    "Produit grillé":

    (
    "Grillé_Produit_Tonnage_sec",
    "Grillé_Produit_F1"
    ),



    "Production":

    (
    "Production_As2O3_net",
    "Production_F1"
    ),



    "Rendement":

    (
    "Rendement_Bilan_Rendement_Métal",
    "Rendement_Bilan_F1"
    )



    }



    for name,(value,f1) in groups.items():


        if value in df.columns and f1 in df.columns:



            result.append({


            "title":
            name+" objectif F1",



            "type":
            "line",



            "xAxis":
            df["Date"]
            .astype(str)
            .tolist(),



            "series":[


            {


            "name":value,


            "data":
            pd.to_numeric(
            df[value],
            errors="coerce"
            )
            .fillna(0)
            .tolist()



            },


            {


            "name":"F1",


            "data":
            pd.to_numeric(
            df[f1],
            errors="coerce"
            )
            .fillna(0)
            .tolist()



            }


            ]



            })



    return result