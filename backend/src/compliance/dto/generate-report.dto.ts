import { IsEnum } from 'class-validator';

export enum ComplianceFramework {
  EU_AI_ACT = 'eu-ai-act',
  SOC2 = 'soc2',
  ISO_42001 = 'iso42001',
}

export class GenerateReportDto {
  @IsEnum(ComplianceFramework)
  framework: ComplianceFramework;
}
