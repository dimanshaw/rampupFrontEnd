import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

const httpOptions = {
  headers: new HttpHeaders({ 'content-type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class WebService {

  constructor(private http: HttpClient) { }

  CallApi(url: string, req: any, type: string){
    if(url && req && type){
      var _url = "http://localhost:3000/api/" + url;

      switch(type) {
        case "POST":
          return this.http.post(_url, req, httpOptions);
          break;

        case "GET":
          return this.http.get(_url);
          break;
        default:
          break;
      }
    }
  }
}
