import { Client } from './user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseDBEntity } from '../../../../core/postgres_db_entities/baseDBEntity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InputWalletDto {
    @ApiPropertyOptional({ description: 'Title of the wallet', example: 'My Wallet' })
    title?: string;

    @ApiPropertyOptional({ description: 'Currency code', example: 'USD', maxLength: 3 })
    currency?: string;

    @ApiProperty({ description: 'Initial balance of the wallet', example: 100 })
    balance: number;

    @ApiProperty({ description: 'ID of the user who owns this wallet', example: '1' })
    ownerId: number;
}


@Entity()
export class Wallet extends BaseDBEntity {
    @Column({ type: 'varchar', nullable: true })
    title: string;

    @Column({ type: 'char', length: 3, nullable: true })
    currency: string;

    @Column()
    balance: number;

    // если решим засорить юзера кошельками, то делаем навигационное обратное св-во
    // @ManyToOne(() => User, (user) => user.wallets)
    // If you only care about the @ManyToOne relationship, you can define it without having @OneToMany on the related entity.
    @ManyToOne(() => Client, null, {
        nullable: false
    })
    owner: Client;

    //@OneToMany(() => WalletSharing, (walletSharing) => walletSharing.wallet)
    //walletSharings: WalletSharing[];

    /**
     * Static factory method;
     * Фабричный статический метод фактически это более наворочення версия конструктора.
     * @param dto
     */
    static create(dto: InputWalletDto): Wallet {
        const bonus = 100;

        const wallet = new Wallet();

        wallet.balance = dto.balance + bonus;
        wallet.title = dto.title;
        wallet.currency = dto.currency;
        wallet.owner = {id: dto.ownerId} as Client;

        return wallet;
    }
}