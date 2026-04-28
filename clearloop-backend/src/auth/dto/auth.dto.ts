export interface RegisterDto {
    companyName: string;
    slug: string;
    name: string;
    email: string;
    password: string;
}

export interface LoginDto{
    email: string;
    password: string;
}