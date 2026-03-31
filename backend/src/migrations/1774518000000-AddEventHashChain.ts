import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventHashChain1774518000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add prevHash column for hash chain linking
    await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN "prevHash" VARCHAR(64) DEFAULT NULL
    `);

    // Add sequence number for deterministic ordering within an org
    await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN "seqNumber" BIGINT DEFAULT NULL
    `);

    // Index to efficiently find the last event in the chain for an org
    await queryRunner.query(`
      CREATE INDEX "IDX_events_orgId_seqNumber"
      ON events ("orgId", "seqNumber" DESC)
      WHERE "seqNumber" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_orgId_seqNumber"`);
    await queryRunner.query(`ALTER TABLE events DROP COLUMN IF EXISTS "seqNumber"`);
    await queryRunner.query(`ALTER TABLE events DROP COLUMN IF EXISTS "prevHash"`);
  }
}
