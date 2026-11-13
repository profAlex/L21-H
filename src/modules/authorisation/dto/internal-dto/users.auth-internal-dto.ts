import { Require_id, Types } from 'mongoose';

// export class UserAuthInternalDto {
//     id: string;
//     email: string;
//     passwordHash: string;
//     login: string;
//     isEmailConfirmed: boolean;
//     deletedAt: Date | null;
//     name: { firstName: string; lastName: string | null };
//
//     constructor(user: User & { _id: Types.ObjectId }) {
//         this.id = user.id || user._id.toString();
//         this.email = user.email;
//         this.passwordHash = user.passwordHash;
//         this.login = user.login;
//         this.isEmailConfirmed = user.isEmailConfirmed;
//
//         this.deletedAt = user.deletedAt instanceof Date ? user.deletedAt : null;
//
//         this.name = {
//             firstName: user.name?.firstName ?? '',
//             lastName: user.name?.lastName ?? null,
//         };
//     }
//
//     static mapToView(
//         user: User & { _id: Types.ObjectId },
//     ): UserAuthInternalDto {
//         return new UserAuthInternalDto(user);
//     }
// }

//
// export class SQLUserAuthInternalDto {
//     id: string;
//     email: string;
//     passwordHash: string;
//     login: string;
//     isEmailConfirmed: boolean;
//     deletedAt: Date | null;
//     name: { firstName: string; lastName: string | null };
//
//     constructor(user: User & { _id: Types.ObjectId }) {
//         this.id = user.id || user._id.toString();
//         this.email = user.email;
//         this.passwordHash = user.passwordHash;
//         this.login = user.login;
//         this.isEmailConfirmed = user.isEmailConfirmed;
//
//         this.deletedAt = user.deletedAt instanceof Date ? user.deletedAt : null;
//
//         this.name = {
//             firstName: user.name?.firstName ?? '',
//             lastName: user.name?.lastName ?? null,
//         };
//     }
//
//     static mapToView(
//         user: User & { _id: Types.ObjectId },
//     ): UserAuthInternalDto {
//         return new UserAuthInternalDto(user);
//     }
// }
