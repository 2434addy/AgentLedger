import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773736222701 implements MigrationInterface {
    name = 'InitialSchema1773736222701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "api_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orgId" uuid NOT NULL, "userId" uuid NOT NULL, "keyHash" character varying NOT NULL, "keyPrefix" character varying NOT NULL, "name" character varying NOT NULL, "lastUsedAt" TIMESTAMP, "revokedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('owner', 'admin', 'member')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orgId" uuid NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "displayName" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'member', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."events_category_enum" AS ENUM('agent_lifecycle', 'llm_call', 'tool_invocation', 'user_action', 'system', 'security', 'guardrail')`);
        await queryRunner.query(`CREATE TYPE "public"."events_level_enum" AS ENUM('debug', 'info', 'warn', 'error', 'fatal')`);
        await queryRunner.query(`CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orgId" uuid NOT NULL, "sessionId" uuid, "agentId" uuid NOT NULL, "category" "public"."events_category_enum" NOT NULL, "level" "public"."events_level_enum" NOT NULL, "message" character varying NOT NULL, "payload" jsonb, "tokensInput" integer, "tokensOutput" integer, "costUsd" numeric(10,6), "latencyMs" integer, "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sessions_status_enum" AS ENUM('active', 'completed', 'failed', 'timeout')`);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orgId" uuid NOT NULL, "agentId" uuid NOT NULL, "status" "public"."sessions_status_enum" NOT NULL DEFAULT 'active', "startedAt" TIMESTAMP NOT NULL DEFAULT now(), "endedAt" TIMESTAMP, "totalEvents" integer NOT NULL DEFAULT '0', "totalCost" numeric(10,6) NOT NULL DEFAULT '0', "metadata" jsonb, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."agents_status_enum" AS ENUM('active', 'idle', 'error', 'offline')`);
        await queryRunner.query(`CREATE TABLE "agents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orgId" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying, "modelProvider" character varying NOT NULL, "modelId" character varying NOT NULL, "status" "public"."agents_status_enum" NOT NULL DEFAULT 'offline', "metadata" jsonb, "lastSeenAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9c653f28ae19c5884d5baf6a1d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."organisations_plan_enum" AS ENUM('free', 'pro', 'enterprise')`);
        await queryRunner.query(`CREATE TABLE "organisations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "plan" "public"."organisations_plan_enum" NOT NULL DEFAULT 'free', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_db67ac918db3917134d0c9edbb3" UNIQUE ("slug"), CONSTRAINT "PK_7bf54cba378d5b2f1d4c10ef4df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('read', 'create', 'update', 'delete', 'login', 'logout', 'signup', 'generate_key', 'revoke_key')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orgId" uuid NOT NULL, "userId" uuid, "action" "public"."audit_logs_action_enum" NOT NULL, "resourceType" character varying NOT NULL, "resourceId" character varying, "metadata" jsonb, "ipAddress" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "api_keys" ADD CONSTRAINT "FK_d3658702fe5e523d6a31f2ad476" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "api_keys" ADD CONSTRAINT "FK_6c2e267ae764a9413b863a29342" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_1890588e47e133fd85670f187d6" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_7d6adc8392476c9da682675f440" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_a00c43630825e2bf55c9cb5d357" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_53bd75f77dd877fc7226cb0cf08" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_03cc3db3f949baaa25e3ee16770" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_93217fd4d9d37328457e2354b8a" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agents" ADD CONSTRAINT "FK_cd8c4145cfa9d3138423240867e" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_2d174aac379260555b5a571c08f" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_2d174aac379260555b5a571c08f"`);
        await queryRunner.query(`ALTER TABLE "agents" DROP CONSTRAINT "FK_cd8c4145cfa9d3138423240867e"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_93217fd4d9d37328457e2354b8a"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_03cc3db3f949baaa25e3ee16770"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_53bd75f77dd877fc7226cb0cf08"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_a00c43630825e2bf55c9cb5d357"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_7d6adc8392476c9da682675f440"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_1890588e47e133fd85670f187d6"`);
        await queryRunner.query(`ALTER TABLE "api_keys" DROP CONSTRAINT "FK_6c2e267ae764a9413b863a29342"`);
        await queryRunner.query(`ALTER TABLE "api_keys" DROP CONSTRAINT "FK_d3658702fe5e523d6a31f2ad476"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
        await queryRunner.query(`DROP TABLE "organisations"`);
        await queryRunner.query(`DROP TYPE "public"."organisations_plan_enum"`);
        await queryRunner.query(`DROP TABLE "agents"`);
        await queryRunner.query(`DROP TYPE "public"."agents_status_enum"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP TYPE "public"."sessions_status_enum"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TYPE "public"."events_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."events_category_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "api_keys"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
