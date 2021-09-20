import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { WebService } from '../home/services/web.service';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup } from '@angular/forms';
import { NotificationService } from "@progress/kendo-angular-notification";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})

export class HomeComponent implements OnInit {

  afuConfig = {
    uploadAPI: {
      url:"https://example-file-upload-api"
    }
};
  gridData = [];
  dataToUpload = [];

  date: Date;
  data: [][];
  
  formData = new FormData();
  saveToDatabaseButtonHidden = true;

  public formGroup: FormGroup;
  private editedRowIndex: number;

  public columns: any[] = [
    { field: 'name', title: 'Student Name' },
    { field: 'email', title: 'E-mail' },
    { field: 'dateOfBirth', title: 'Data of Birth' },
    { field: 'age', title: 'Age' }
  ];

  constructor(private webService: WebService, public datePipe: DatePipe, private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.getStudentDetailsFromDatabase();
    this.webService.listen('events').subscribe((data) => {
      console.log("from websocket server ", data);
      this.getStudentDetailsFromDatabase();
    })
  }


  onFileUpload_old(e) {
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
    this.webService.CallFileUpload('fileUpload', this.formData, 'POST').subscribe((res)=> {
      console.log("Excel sheet upload ");
     
    })
  }

  onFileUpload(e){
    let fileName = '';
      const file:File = e.target.files[0];
  
      if(file){
        fileName = file.name;
        
        this.formData.append("file", file, fileName);
        this.saveToDatabaseButtonHidden = false;
      }
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
            id: element.id
          });
        });
      });
  }


  public editHandler({ sender, rowIndex, dataItem }) {
    this.closeEditor(sender);

    this.formGroup = new FormGroup({
      name: new FormControl(dataItem.name),
      dateOfBirth: new FormControl(dataItem.dateOfBirth),
      email: new FormControl(dataItem.email),
      age: new FormControl(dataItem.age),
      id: new FormControl(dataItem.id)
    });

    this.editedRowIndex = rowIndex;

    sender.editRow(rowIndex, this.formGroup);
  }

  private closeEditor(grid, rowIndex = this.editedRowIndex) {
    grid.closeRow(rowIndex);
    this.editedRowIndex = undefined;
    this.formGroup = undefined;
  }

  public cancelHandler({ sender, rowIndex }) {
    this.closeEditor(sender, rowIndex);
  }

  public saveHandler({ sender, rowIndex, formGroup, isNew }) {
    const student = formGroup.value;

    // this.webService.CallApi('student/updateStudent', student, 'POST').subscribe((res) => {
    //   console.log("Updated studetn response ", res);
    //   this.getStudentDetailsFromDatabase();
    // })

    this.updateStudentApiCall(student, 'update');

    console.log("Update student ", isNew, formGroup.value);

    sender.closeRow(rowIndex);
  }

  public removeHandler({ sender, rowIndex, dataItem }) {
    //this.editService.remove(dataItem);

    this.formGroup = this.formGroup = new FormGroup({
      name: new FormControl(dataItem.name),
      dateOfBirth: new FormControl(dataItem.dateOfBirth),
      email: new FormControl(dataItem.email),
      age: new FormControl(dataItem.age),
      id: new FormControl(dataItem.id),
      isDeleted: new FormControl(true)
    });

    const student = this.formGroup.value;

    console.log("Remove handler clicked ", this.formGroup.value)

    this.updateStudentApiCall(student, 'remove');

  }

  private updateStudentApiCall(student, apiCall){
    this.webService.CallApi('student/updateStudent', student, 'POST').subscribe((res) => {
      console.log("Updated studetn response ", res);
      this.getStudentDetailsFromDatabase();
      if(apiCall == 'remove'){
        this.showNotification('success', 'Student removed!!!')
      }else if(apiCall == 'update'){
        this.showNotification('success', 'Update success!!!')
      }

      

    })
  }

  public showNotification(type, message): void {
    this.notificationService.show({
      content: message,
      hideAfter: 600,
      position: { horizontal: "right", vertical: "bottom" },
      animation: { type: "fade", duration: 400 },
      type: { style: type, icon: true },
    });
  }


}
