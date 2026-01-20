import { logger } from '../../utils/logger';
import { resumeParserService } from '../resumeParserService';
import { batchMatchingService } from '../phase3/batchMatchingService';

export async function initPhase4Services(): Promise<void> {
  try {
    logger.info('Phase 4 Services initialized');
    logger.info('- Resume Parser Service: Ready');
    logger.info('- Batch Matching Service: Ready');
  } catch (err) {
    logger.error('Phase 4 init failed', { error: err });
    throw err;
  }
}

export { resumeParserService } from '../resumeParserService';
export { batchMatchingService } from '../phase3/batchMatchingService';


