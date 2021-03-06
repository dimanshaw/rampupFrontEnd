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
      dateofbirth
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
    dateofbirth : ${updateDOB}
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
    { field: 'dateofbirth', title: 'Data of Birth' },
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

    this.getStudentDetailsFromDataBase();
    this.webService.listen('events').subscribe((data) => {
      console.log("file upload response ", data);
      this.getStudentDetailsFromDataBase();
      this.showNotification('success', 'Excel file uploaded!!!');
    });
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
    console.log("Fetching data from the database")
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
    },
    ()=> {
      console.log("this is the bad request ")
      this.showNotification('error', "Execution failed!. The data entered might be not valid.")
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
      this.showNotification('success', 'Record deleted!!')
      this.getStudentDetailsFromDataBase();
    },
    () => {
      this.showNotification('error', 'Record not removed!, something wrong in the server.')
    })

    

    this.close();
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
