import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventStateSnapshots1774258800000 implements MigrationInterface {
    name = 'AddEventStateSnapshots1774258800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "stateBefore" jsonb`);
        await queryRunner.query(`ALTER TABLE "events" ADD "stateAfter" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "stateAfter"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "stateBefore"`);
    }
}
