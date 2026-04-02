import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventHash1774172400000 implements MigrationInterface {
    name = 'AddEventHash1774172400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "hash" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "events" ADD "tampered" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "tampered"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "hash"`);
    }
}
