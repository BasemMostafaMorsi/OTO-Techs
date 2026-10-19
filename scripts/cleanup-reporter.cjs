module.exports = class CleanupReporter {
  onExit() {
    try { require('./clean-test-results.cjs').clean(); }
    catch (error) { console.warn('Output cleanup skipped:', error.message); }
  }
};
