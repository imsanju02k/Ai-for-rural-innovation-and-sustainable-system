import { Tags } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

/**
 * Utility functions for applying consistent tags across resources
 */

/**
 * Apply standard tags to a construct
 * @param construct - CDK construct to tag
 * @param environment - Environment name
 * @param additionalTags - Additional tags to apply
 */
export function applyStandardTags(
  construct: IConstruct,
  environment: string,
  additionalTags?: Record<string, string>
): void {
  // Standard tags
  Tags.of(construct).add('Environment', environment);
  Tags.of(construct).add('Project', 'FarmPlatform');
  Tags.of(construct).add('ManagedBy', 'CDK');

  // Apply additional tags
  if (additionalTags) {
    Object.entries(additionalTags).forEach(([key, value]) => {
      Tags.of(construct).add(key, value);
    });
  }
}

/**
 * Apply cost allocation tags
 * @param construct - CDK construct to tag
 * @param costCenter - Cost center identifier
 * @param owner - Resource owner
 */
export function applyCostAllocationTags(
  construct: IConstruct,
  costCenter: string,
  owner?: string
): void {
  Tags.of(construct).add('CostCenter', costCenter);
  if (owner) {
    Tags.of(construct).add('Owner', owner);
  }
}

/**
 * Apply compliance tags
 * @param construct - CDK construct to tag
 * @param dataClassification - Data classification level
 * @param compliance - Compliance requirements
 */
export function applyComplianceTags(
  construct: IConstruct,
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted',
  compliance?: string[]
): void {
  Tags.of(construct).add('DataClassification', dataClassification);
  if (compliance && compliance.length > 0) {
    Tags.of(construct).add('Compliance', compliance.join(','));
  }
}

/**
 * Apply backup tags
 * @param construct - CDK construct to tag
 * @param backupPolicy - Backup policy name
 * @param retentionDays - Backup retention in days
 */
export function applyBackupTags(
  construct: IConstruct,
  backupPolicy: string,
  retentionDays: number
): void {
  Tags.of(construct).add('BackupPolicy', backupPolicy);
  Tags.of(construct).add('BackupRetention', retentionDays.toString());
}

/**
 * Get standard tags as a record
 * @param environment - Environment name
 * @param additionalTags - Additional tags
 * @returns Tags as a record
 */
export function getStandardTags(
  environment: string,
  additionalTags?: Record<string, string>
): Record<string, string> {
  return {
    Environment: environment,
    Project: 'FarmPlatform',
    ManagedBy: 'CDK',
    ...additionalTags,
  };
}

/**
 * Apply tags from a record to a construct
 * @param construct - CDK construct to tag
 * @param tags - Tags to apply as a record
 */
export function applyTags(
  construct: IConstruct,
  tags: Record<string, string>
): void {
  Object.entries(tags).forEach(([key, value]) => {
    Tags.of(construct).add(key, value);
  });
}
