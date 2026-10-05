/**
 * Decides whether this backend instance owns scheduled background work.
 * A missing value is deliberately disabled so a new deployment cannot
 * accidentally duplicate production jobs.
 */
export const getScheduledJobsEnabled = (value: string | undefined): boolean => {
  if (value === undefined) {
    return false;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(
    'SCHEDULED_JOBS_ENABLED must be either "true" or "false".'
  );
};
