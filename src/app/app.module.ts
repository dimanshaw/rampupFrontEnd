import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GridModule } from '@progress/kendo-angular-grid';
import { HomeComponent } from './home/home.component';
import { DatePipe } from '@angular/common';


import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ButtonsModule,
    BrowserAnimationsModule,
    GridModule,
    HttpClientModule
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
