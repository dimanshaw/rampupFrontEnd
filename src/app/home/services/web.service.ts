import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { io } from 'socket.io-client';
import { Observable } from 'rxjs';


const httpOptions = {
  headers: new HttpHeaders({ 'content-type': 'application/json'})
};

const httpOptionsFormData = {
  headers: new HttpHeaders({ 'content-type': 'multipart/form-data'})
};

@Injectable({
  providedIn: 'root'
})
export class WebService {
  socket: any;

  constructor(private http: HttpClient) {
    this.socket = io("http://localhost:3001");
   }


  listen(eventName: string){
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data) => {
        subscriber.next(data);
      })
    })
  }

  emit(eventName: string, data: any){
    this.socket.emit(eventName, data);
  }


  CallFileUpload(url: string, req: any, type: string){
    if(url && req && type){
      var _url = "http://localhost:3001/" + url;

      switch(type){
        case "POST":
          return this.http.post(_url, req);
          break;
        default:
          break;
      }
    }
  }

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
