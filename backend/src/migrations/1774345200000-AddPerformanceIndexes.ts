import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1774345200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Events: default list query (orgId + timestamp DESC)
    await queryRunner.query(
      `CREATE INDEX "IDX_events_orgId_timestamp" ON "events" ("orgId", "timestamp" DESC)`,
    );

    // Events: session replay and per-session listing
    await queryRunner.query(
      `CREATE INDEX "IDX_events_orgId_sessionId" ON "events" ("orgId", "sessionId")`,
    );

    // Events: per-agent filtering
    await queryRunner.query(
      `CREATE INDEX "IDX_events_orgId_agentId" ON "events" ("orgId", "agentId")`,
    );

    // Sessions: per-agent session listing
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_orgId_agentId" ON "sessions" ("orgId", "agentId")`,
    );

    // API keys: lookup by hash on every SDK request
    await queryRunner.query(
      `CREATE INDEX "IDX_api_keys_keyHash" ON "api_keys" ("keyHash") WHERE "revokedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_api_keys_keyHash"`);
    await queryRunner.query(`DROP INDEX "IDX_sessions_orgId_agentId"`);
    await queryRunner.query(`DROP INDEX "IDX_events_orgId_agentId"`);
    await queryRunner.query(`DROP INDEX "IDX_events_orgId_sessionId"`);
    await queryRunner.query(`DROP INDEX "IDX_events_orgId_timestamp"`);
  }
}
