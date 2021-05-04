import {MigrationInterface, QueryRunner} from "typeorm";

export class v11620122449927 implements MigrationInterface {
    name = 'v11620122449927'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `order_transaction` (`id` int NOT NULL AUTO_INCREMENT, `state` int NOT NULL, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `order_id` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `order` (`id` int NOT NULL AUTO_INCREMENT, `code` varchar(255) NOT NULL, `user_id` int NOT NULL, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `order_transaction` ADD CONSTRAINT `FK_94ac74479abc1429e2cea7f89ce` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `order_transaction` DROP FOREIGN KEY `FK_94ac74479abc1429e2cea7f89ce`");
        await queryRunner.query("DROP TABLE `order`");
        await queryRunner.query("DROP TABLE `order_transaction`");
    }

}
