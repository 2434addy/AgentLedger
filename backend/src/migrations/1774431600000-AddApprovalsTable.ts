import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApprovalsTable1774431600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "approval_type_enum" AS ENUM ('tool_execution', 'data_access', 'cost_threshold', 'custom')`,
    );

    await queryRunner.query(
      `CREATE TYPE "approval_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'expired')`,
    );

    await queryRunner.query(`
      CREATE TABLE "approvals" (
        "id"            UUID                    NOT NULL DEFAULT uuid_generate_v4(),
        "orgId"         UUID                    NOT NULL,
        "agentId"       UUID                    NOT NULL,
        "sessionId"     UUID,
        "type"          "approval_type_enum"    NOT NULL,
        "status"        "approval_status_enum"  NOT NULL DEFAULT 'pending',
        "payload"       JSONB                   NOT NULL,
        "requestedBy"   VARCHAR                 NOT NULL,
        "reviewedBy"    UUID,
        "reviewedAt"    TIMESTAMP,
        "reviewComment" TEXT,
        "expiresAt"     TIMESTAMP               NOT NULL,
        "createdAt"     TIMESTAMP               NOT NULL DEFAULT now(),
        CONSTRAINT "PK_approvals" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "approvals"
         ADD CONSTRAINT "FK_approvals_orgId"
         FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "approvals"
         ADD CONSTRAINT "FK_approvals_agentId"
         FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "approvals"
         ADD CONSTRAINT "FK_approvals_reviewedBy"
         FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_approvals_orgId_status"
         ON "approvals" ("orgId", "status")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_approvals_orgId_createdAt"
         ON "approvals" ("orgId", "createdAt" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_approvals_orgId_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_approvals_orgId_status"`);
    await queryRunner.query(`DROP TABLE "approvals"`);
    await queryRunner.query(`DROP TYPE "approval_status_enum"`);
    await queryRunner.query(`DROP TYPE "approval_type_enum"`);
  }
}
