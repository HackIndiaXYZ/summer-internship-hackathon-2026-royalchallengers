const statusMap = new Map();

function setStatus(scanId, statusObj) {
  const existing = statusMap.get(scanId) || {};
  const updated = {
    ...existing,
    ...statusObj,
    updatedAt: Date.now()
  };
  statusMap.set(scanId, updated);

  // Auto-cleanup 10 minutes after completion (increased for clinical safety)
  if (statusObj.complete || statusObj.error) {
    setTimeout(() => {
      statusMap.delete(scanId);
    }, 600000);
  }
}

function getStatus(scanId) {
  return statusMap.get(scanId) || null;
}

function clearStatus(scanId) {
  statusMap.delete(scanId);
}

module.exports = { setStatus, getStatus, clearStatus };
