import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable({

providedIn:'root'

})


export class Api {


private apiUrl =
'http://localhost:8000/analyze';



constructor(
private http:HttpClient
){}



analyzeCSV(file:File){


const formData =
new FormData();


formData.append(
'file',
file
);



return this.http.post<any>(

this.apiUrl,

formData

);


}


}