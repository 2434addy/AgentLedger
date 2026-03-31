import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetTokens1774604400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "tokenHash" VARCHAR(64) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_tokenHash" ON password_reset_tokens ("tokenHash") WHERE used = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS password_reset_tokens`);
  }
}
