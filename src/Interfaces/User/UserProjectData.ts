import { Project } from "../Project/Project";
import { User } from "./User";

export interface UserProjectData{
    projects: Project[];
    userAccount: User;
}