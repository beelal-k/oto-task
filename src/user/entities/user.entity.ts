export class User {
    _id: string;
    name: string;
    email: string;
    password: string;
    token: string | null;
    totalPoints: number;
    createdAt: Date;
    isLoggedIn: boolean;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
        this.createdAt = new Date();
        this.isLoggedIn = false;
        this.token = null;
    }
}