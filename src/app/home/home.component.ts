import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { WebService } from '../home/services/web.service';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  gridData = [];
  dataToUpload = [];

  date: Date;
  data: [][];

  public columns: any[] = [
    { field: 'name', title: 'Student Name' },
    { field: 'email', title: 'E-mail' },
    { field: 'dateOfBirth', title: 'Data of Birth' },
    { field: 'age', title: 'Age' },
  ];
  constructor(private webService: WebService, public datePipe: DatePipe) {}

  ngOnInit(): void {
    this.getStudentDetailsFromDatabase();
  }

  onFileUpload(e) {
    const uploadedFile: DataTransfer = <DataTransfer>e.target.files;

    if (e.target.files.length !== 1)
      throw new Error('Cannot upload multiple files at once!!!');

    const reader: FileReader = new FileReader();

    reader.onload = (ev: any) => {
      const bstr: string = ev.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsName: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsName];

      this.data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      let x: any = this.data[0];

      for (let index = 1; index < this.data.length; index++) {
        let x: any = this.data[index];
        this.dataToUpload.push({
          name: x[0],
          email: x[1],
          dateOfBirth: this.datePipe.transform(
            new Date((x[2] - 25569) * 86400000),
            'yyyy-MM-dd'
          ),
          age:
            new Date().getFullYear() -
            new Date((x[2] - 25569) * 86400000).getFullYear(),
        });
      }

      console.log('grid dataset ', this.dataToUpload);
    };

    reader.readAsBinaryString(e.target.files[0]);
  }

  saveStudentToDatabase() {
    console.log('data to save in database ', this.dataToUpload);
    this.webService
      .CallApi('student', this.dataToUpload, 'POST')
      .subscribe((res) => {
        this.getStudentDetailsFromDatabase();
      });
  }

  getStudentDetailsFromDatabase() {
    this.gridData = [];
    let x = '';
    this.webService
      .CallApi('student/findAll', this.gridData, 'GET')
      .subscribe((res: any) => {
        res.forEach((element) => {
          this.gridData.push({
            name: element.name,
            email: element.email,
            dateOfBirth: this.datePipe.transform(
              element.dateOfBirth,
              'yyyy-MM-dd'
            ),
            age: element.age,
          });
        });
      });
  }
}
