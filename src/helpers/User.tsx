export type UserRole = "admin" | "manager" | "operator" | "user";

export type IdentificationType = "CC" | "CE" | "NIT" | "PAS" | "OTRO";

export type User = {
  uuid: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  identificationType?: IdentificationType;
  identificationNumber?: string;
  phone?: string;
  address?: string;
  position?: string;
  status?: string;
  dateOfBirth?: Date;
};