import {
    Column,
    CreateDateColumn, DeleteDateColumn,
    Entity,
    Index,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { BaseDBEntity } from '../../../../core/postgres_db_entities/baseDBEntity';
import { Profile } from '../../../../core/postgres_db_entities/profile.entity';
import { InputWalletDto, Wallet } from './wallet.entity';
import { ForbiddenException } from '@nestjs/common';

@Entity()
export class Client extends BaseDBEntity{
    // это нам не надо, т.к. мы экстендимся от базового типа в котором это есть уже
    // @PrimaryGeneratedColumn()
    // id: number;

    @Column({unique: true}) // это индекс
    firstName: string;

    @Column({type: 'text'})
    lastName: string;

    @Column({nullable: true })
    passportNumber: string | null;

    @Column()
    isMarried: boolean;

    @Column()
    dob: Date;

    @Column()
    status: string;

    update(dto: any){
        if (dto.isMarried && !dto.passportNumber) {
            throw new Error('Passport must have if merried')
        }

        this.firstName = dto.firstName;
        this.lastName = dto.lastName;

        this.passportNumber = dto.passportNumber;
        this.isMarried = dto.isMarried;

        if (dto.status === 'vacation')
            if (this.wallets.some(w => w.balance < 0)) {
                throw Error('Client can go to vacation because has dept');
            }
    }

    static create(dto: any) {
        const client = new Client();

        client.firstName = dto.firstName;
        client.lastName = dto.lastName;
        client.status = 'not-confirmed';
        client.isMarried = dto.isMarried;
        client.dob = new Date(2000, 10, 1);

        client.profile = { // Profile.create
            hobby: 'it, js',
            education: 'it-incubator',
            // user: user // это можно не делать
        } as Profile

        client.wallets = [
            {
                title: 'Main wallet',
                currency: 'USD',
                balance: 1000,
                // owner: client // можем и нет смысла указывать
            } as Wallet
        ]
        return client;
    }

    // точно хотим засорять юзера профилем?
    @OneToOne(() => Profile, (profile) => profile.client, {
        cascade: true // благодаря этому мы можем сохраняя юзера применить изменения и на данную сущность
    })
    profile: Profile;

    // точно хотим засорять юзера кошельками?
    @OneToMany(() => Wallet, (wallet) => wallet.owner, {
        cascade: true // благодаря этому мы можем сохраняя юзера применить изменения и на данную сущность
    })
    wallets: Wallet[];

    // точно хотим засорять юзера кошельками?
    // @OneToMany(() => WalletSharing, (walletSharing) => walletSharing.user)
    // walletSharings: WalletSharing[];
    addNewWallet(createWalletDto: InputWalletDto) {
        // this.wallets = [];
        if (this.wallets.some(w => w.balance < 0)) {
            throw new ForbiddenException('User has negative balance and cannot create a new wallet');
        }

        const wallet = Wallet.create(createWalletDto)
        this.wallets.push(wallet)
        return wallet;
    }
}


@Entity('users')
// Переносим частичный уникальный индекс из SQL в декоратор
@Index('idx_users_recovery_code_unique', ['recoveryCode'], {
    unique: true,
    where: 'recovery_code IS NOT NULL',
})
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    login: string;

    @Column({ type: 'varchar', length: 255, name: 'password_hash' })
    passwordHash: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255, name: 'first_name' })
    firstName: string;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'last_name' })
    lastName: string | null;

    @Column({ type: 'boolean', default: false, name: 'is_email_confirmed' })
    isEmailConfirmed: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'email_confirmation_code' })
    emailConfirmationCode: string | null;

    @Column({ type: 'timestamp with time zone', nullable: true, name: 'email_confirmation_expiration_date' })
    emailConfirmationExpirationDate: Date | null;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'recovery_code' })
    recoveryCode: string | null;

    @Column({ type: 'timestamp with time zone', nullable: true, name: 'recovery_code_expiration_date' })
    recoveryCodeExpirationDate: Date | null;

    @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true, name: 'deleted_at' })
    deletedAt: Date | null;
}