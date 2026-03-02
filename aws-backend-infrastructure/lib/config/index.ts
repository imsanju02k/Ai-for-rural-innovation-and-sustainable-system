import { EnvironmentConfig } from './types';
import { devConfig } from './dev';
import { stagingConfig } from './staging';
import { prodConfig } from './prod';

/**
 * Get configuration for the specified environment
 * @param environment - Environment name (dev, staging, prod)
 * @returns Environment configuration
 */
export function getConfig(environment: string): EnvironmentConfig {
  switch (environment.toLowerCase()) {
    case 'dev':
    case 'development':
      return devConfig;
    case 'staging':
    case 'stage':
      return stagingConfig;
    case 'prod':
    case 'production':
      return prodConfig;
    default:
      throw new Error(
        `Unknown environment: ${environment}. Valid values are: dev, staging, prod`
      );
  }
}

export * from './types';
export { devConfig, stagingConfig, prodConfig };
