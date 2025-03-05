export interface User {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  birthday: string;
  username: string;
  password: string;
  //have they created a cuesheet yet?
  newAccount: boolean;
}
