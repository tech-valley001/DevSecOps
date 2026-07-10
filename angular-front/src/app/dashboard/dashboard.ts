import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';

import { Api } from '../services/api';



@Component({

  selector: 'app-dashboard',

  standalone: true,

  imports: [
    CommonModule,
    NgxEchartsModule
  ],

  templateUrl: './dashboard.html',

  styleUrls: ['./dashboard.css']

})


export class Dashboard {



  // =============================
  // Fichier Excel
  // =============================

  selectedFile!: File;

  fileName: string = "";

  loading: boolean = false;



  // =============================
  // Navigation
  // =============================

  selectedView: string = "kpi";



  // =============================
  // Données backend
  // =============================

  kpis:any = {};

  charts:any[] = [];

  objectives:any[] = [];



  // graphiques filtrés

  filteredCharts:any[] = [];




  constructor(
    private api:Api
  ){}




  // =============================
  // Choisir fichier
  // =============================


  onFileSelected(event:any){


    const file =
    event.target.files[0];


    if(file){


      this.selectedFile=file;


      this.fileName=file.name;


    }


  }






  // =============================
  // Analyse fichier
  // =============================


  analyze(){


    if(!this.selectedFile){


      alert(
        "Choisir un fichier Excel"
      );


      return;

    }



    this.loading=true;



    this.api.analyzeCSV(

      this.selectedFile

    )

    .subscribe({



      next:(response)=>{


        console.log(response);



        this.kpis =
        response.kpis || {};



        this.charts =
        response.charts || [];



        this.objectives =
        response.objectives || [];



        // par défaut tous les graphiques

        this.filteredCharts =
        this.charts;



        this.loading=false;



      },



      error:(error)=>{


        console.error(error);


        this.loading=false;


      }


    });



  }







  // =============================
  // Changement bouton
  // =============================


  changeView(view:string){


    this.selectedView=view;



    if(view==="kpi" || view==="f1"){


      return;

    }



    this.filteredCharts =

    this.charts.filter(

      (chart:any)=>{


        const title =

        chart.title
        .toLowerCase();




        switch(view){



          case "concentre":


            return (

              title.includes("concentré")

              ||

              title.includes("concentre")

              ||

              title.includes("co_ba")

            );





          case "grille":


            return (

              title.includes("grillé")

              ||

              title.includes("grille")

            );





          case "production":


            return title.includes(
              "production"
            );






          case "rendement":


            return title.includes(
              "rendement"
            );





          default:


            return false;


        }



      }


    );


  }







  // =============================
  // Configuration ECharts
  // =============================


  getChartOption(chart:any){



    return {


      title:{


        text:chart.title,


        left:"center"


      },



      tooltip:{


        trigger:"axis"


      },



      grid:{


        left:"5%",


        right:"5%",


        bottom:"15%",


        containLabel:true


      },



      xAxis:{


        type:"category",


        data:chart.xAxis


      },



      yAxis:{


        type:"value"


      },



      series:


      chart.series.map(

        (serie:any)=>({


          name:serie.name,


          type:
          chart.type || "line",


          smooth:true,


          data:
          serie.data



        })


      )


    };

  }



}