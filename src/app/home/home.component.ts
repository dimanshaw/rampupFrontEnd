import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { WebService } from '../home/services/web.service';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup } from '@angular/forms';
import { NotificationService } from '@progress/kendo-angular-notification';
import { GridDataResult, PageChangeEvent } from '@progress/kendo-angular-grid';
import { Apollo, gql } from 'apollo-angular';
import { Student } from '../models/student';

let deleteId;
let updateId;

let updateName;
let updateEmail;
let updateDOB;
let updateAge;
let updateIsdeleted;

const Get_StudentList = gql`
  query {
    students(isDeleted: false) {
      id
      name
      email
      dateOfBirth
      age
      isDeleted
    }
  }
`;

const Delete_Student = gql`mutation {
  deleteStudent(id: ${deleteId})
}`;

const Update_Student = gql`mutation {
  updateStudent(id : ${updateId}
  input: {
    name : ${updateName}
    email : ${updateEmail}
    age : ${updateAge}
    dateOfBirth : ${updateDOB}
    isDeleted : ${updateIsdeleted}
  })
}`;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  allStudents: Student[] = [];

  public opened = false;

  private deleteSender;
  private deleteRowIndex;
  private deleteDataItem;

  gridData: GridDataResult;
  dataToUpload = [];

  date: Date;
  data: [][];

  //private items: any[];

  formData = new FormData();
  saveToDatabaseButtonHidden = true;

  public formGroup: FormGroup;
  private editedRowIndex: number;

  public pageSize = 10;
  public skip = 0;

  public columns: any[] = [
    { field: 'name', title: 'Student Name' },
    { field: 'email', title: 'E-mail' },
    { field: 'dateOfBirth', title: 'Data of Birth' },
    { field: 'age', title: 'Age' },
  ];

  constructor(
    private webService: WebService,
    public datePipe: DatePipe,
    private notificationService: NotificationService,
    private apollo: Apollo
  ) {}

  ngOnInit(): void {
    this.getStudentDetailsFromDataBase();

    //this.getStudentDetailsFromDatabase();
    this.getStudentDetailsFromDataBase();
    this.webService.listen('events').subscribe((data) => {
      //this.getStudentDetailsFromDatabase();
      this.getStudentDetailsFromDataBase();
      this.showNotification('success', 'Excel file uploaded!!!');
    });
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
    };

    reader.readAsBinaryString(e.target.files[0]);
  }

  saveStudentToDatabase() {
    this.webService
      .CallFileUpload('fileUpload', this.formData, 'POST')
      .subscribe((res) => {});
  }

  onFileUpload(e) {
    let fileName = '';
    const file: File = e.target.files[0];

    if (file) {
      fileName = file.name;

      this.formData.append('file', file, fileName);
      this.saveToDatabaseButtonHidden = false;
    }
  }

  getStudentDetailsFromDataBase() {
    this.apollo
      .watchQuery<any>({
        query: Get_StudentList,
      })
      .valueChanges.subscribe(({ data, loading }) => {
        this.allStudents = data.students;
        this.loadItems();
      });
  }

  public editHandler({ sender, rowIndex, dataItem }) {
    this.closeEditor(sender);

    this.formGroup = new FormGroup({
      name: new FormControl(dataItem.name),
      dateOfBirth: new FormControl(dataItem.dateOfBirth),
      email: new FormControl(dataItem.email),
      age: new FormControl(dataItem.age),
      id: new FormControl(dataItem.id),
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

    //this.updateStudentApiCall(student, 'update');

    updateId = student.id;
    updateName = student.name;
    updateEmail = student.email;
    updateDOB = student.dateOfBirth;
    updateAge = student.age;

    console.log("Form group ", student)

    this.apollo.mutate({
      mutation: gql`mutation{
        updateStudent(input: {
          id: ${updateId}
          name: \"${updateName}\"
          email: \"${updateEmail}\"
          age: ${updateAge}
          dateOfBirth: \"${updateDOB}\"
          isDeleted: false
        })
      }`
    }).subscribe((data) => {
      console.log( "Update response ",data)
      this.getStudentDetailsFromDataBase();
    })


    sender.closeRow(rowIndex);
  }

  public removeHandler({ sender, rowIndex, dataItem }) {
    this.deleteSender = sender;
    this.deleteRowIndex = rowIndex;
    this.deleteDataItem = dataItem;
    this.opened = true;
  }

  private onDeleteConfirm() {
    updateId = this.deleteDataItem.id;

    updateIsdeleted = true;
    updateName = this.deleteDataItem.name;
    updateEmail = this.deleteDataItem.email;
    updateAge = this.deleteDataItem.age;
    updateDOB = this.deleteDataItem.dataOfBirth;

    console.log("dob ", this.deleteDataItem)

    // this.apollo.mutate({
    //   mutation: gql`mutation{
    //     deleteStudentPermanant(id: ${updateId})
    //   }`
    // }).subscribe((data) => {
    //   console.log( data)
    // })

    this.apollo.mutate({
      mutation: gql`mutation{
        updateStudent(input: {
          id: ${updateId}
          
          isDeleted: true
        })
      }`
    }).subscribe((data) => {
      console.log( "Update response ",data)
      this.getStudentDetailsFromDataBase();
    })

    

    this.close();
  }

  private updateStudentApiCall(student, apiCall) {
    
    console.log("update called")
  
  }

  public showNotification(type, message): void {
    this.notificationService.show({
      content: message,
      hideAfter: 3000,
      position: { horizontal: 'right', vertical: 'top' },
      height: 60,
      width: 500,
      animation: { type: 'slide', duration: 400 },
      type: { style: type, icon: true },
    });
  }

  public pageChange(event: PageChangeEvent): void {
    this.skip = event.skip;
    this.loadItems();
  }

  private loadItems(): void {
    this.gridData = {
      data: this.allStudents.slice(this.skip, this.skip + this.pageSize),
      total: this.allStudents.length,
    };
  }

  public close() {
    this.opened = false;
  }

  public open() {
    this.opened = true;
  }
}
