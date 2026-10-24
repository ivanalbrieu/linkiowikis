// services/flushService.js
const { Op } = require('sequelize');
const DeletedPage = require('../models/DeletedPage');
const DeletedRevision = require('../models/DeletedRevision');

/**
 * Flush/purge permanently deleted records from the archive tables
 * based on retention age criteria.
 *
 * @param {Object} options
 * @param {number} [options.olderThanDays] - Age in days beyond which records are permanently deleted.
 * @param {boolean} [options.dryRun] - If true, only counts matching records without deleting.
 * @returns {Promise<{success: boolean, flushedPages: number, flushedRevisions: number, olderThanDays: number, thresholdDate: Date}>}
 */
async function flushDeletedRecords(options = {}) {
  const isEnabled = process.env.FLUSH_ENABLED !== 'false';
  if (!isEnabled && !options.force) {
    return {
      success: false,
      message: 'Flush service is currently disabled in configuration (FLUSH_ENABLED=false).',
      flushedPages: 0,
      flushedRevisions: 0
    };
  }

  const olderThanDays = options.olderThanDays !== undefined
    ? parseInt(options.olderThanDays, 10)
    : parseInt(process.env.FLUSH_RETENTION_DAYS || '30', 10);

  const thresholdDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  try {
    if (options.dryRun) {
      const pendingPages = await DeletedPage.count({
        where: {
          deleted_at: { [Op.lt]: thresholdDate }
        }
      });
      const pendingRevisions = await DeletedRevision.count({
        where: {
          deleted_at: { [Op.lt]: thresholdDate }
        }
      });
      return {
        success: true,
        dryRun: true,
        pendingPages,
        pendingRevisions,
        olderThanDays,
        thresholdDate
      };
    }

    // Permanently destroy revisions older than threshold date
    const flushedRevisions = await DeletedRevision.destroy({
      where: {
        deleted_at: { [Op.lt]: thresholdDate }
      }
    });

    // Permanently destroy deleted pages older than threshold date
    const flushedPages = await DeletedPage.destroy({
      where: {
        deleted_at: { [Op.lt]: thresholdDate }
      }
    });

    console.log(`[FlushService] Purged ${flushedPages} archived pages and ${flushedRevisions} archived revisions older than ${olderThanDays} days (before ${thresholdDate.toISOString()}).`);

    return {
      success: true,
      flushedPages,
      flushedRevisions,
      olderThanDays,
      thresholdDate
    };
  } catch (error) {
    console.error('[FlushService] Error during retention flush:', error);
    throw error;
  }
}

let schedulerTimer = null;

/**
 * Start the background retention flush scheduler.
 * Runs at the specified hourly interval (defaulting to every 24 hours).
 */
function startFlushScheduler() {
  const isEnabled = process.env.FLUSH_ENABLED !== 'false';
  if (!isEnabled) {
    console.log('[FlushService] Scheduled background flush is disabled (FLUSH_ENABLED=false).');
    return;
  }

  const intervalHours = parseFloat(process.env.FLUSH_INTERVAL_HOURS || '24');
  const intervalMs = Math.max(intervalHours * 60 * 60 * 1000, 60000); // Minimum 1 minute safety check

  // Initial run after 15 seconds of startup to avoid blocking server boot
  setTimeout(async () => {
    try {
      console.log('[FlushService] Running initial startup retention check...');
      await flushDeletedRecords();
    } catch (err) {
      console.error('[FlushService] Initial flush run failed:', err.message);
    }
  }, 15000);

  // Periodic interval
  if (schedulerTimer) clearInterval(schedulerTimer);
  schedulerTimer = setInterval(async () => {
    try {
      console.log('[FlushService] Running scheduled retention check...');
      await flushDeletedRecords();
    } catch (err) {
      console.error('[FlushService] Scheduled flush run failed:', err.message);
    }
  }, intervalMs);

  if (schedulerTimer.unref) schedulerTimer.unref();

  console.log(`[FlushService] Background retention scheduler active (interval: every ${intervalHours}h, retention: ${process.env.FLUSH_RETENTION_DAYS || 30} days).`);
}

function stopFlushScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[FlushService] Background retention scheduler stopped.');
  }
}

module.exports = {
  flushDeletedRecords,
  startFlushScheduler,
  stopFlushScheduler
};
