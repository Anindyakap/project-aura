import { describe, expect, it } from 'vitest';
import { getScheduledJobsEnabled } from './scheduledJobs';

describe('getScheduledJobsEnabled', () => {
  it('disables scheduled jobs when the setting is missing', () => {
    expect(getScheduledJobsEnabled(undefined)).toBe(false);
  });

  it('enables scheduled jobs only for the explicit true value', () => {
    expect(getScheduledJobsEnabled('true')).toBe(true);
  });

  it('disables scheduled jobs for the explicit false value', () => {
    expect(getScheduledJobsEnabled('false')).toBe(false);
  });

  it('rejects an invalid setting value', () => {
    expect(() => getScheduledJobsEnabled('yes')).toThrow(
      'SCHEDULED_JOBS_ENABLED must be either "true" or "false".'
    );
  });
});
