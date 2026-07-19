'use strict';

const IMPLEMENTATION_STATES = new Set(['NOT_STARTED', 'PARTIAL', 'COMPLETE', 'DEFERRED']);

function parseImplementationState(taskText) {
  const match = String(taskText).match(/^Implementation State:\s*([A-Z_]+)\s*$/m);
  if (!match) {
    throw new Error(
      'Missing Implementation State metadata; expected NOT_STARTED, PARTIAL, COMPLETE, or DEFERRED.',
    );
  }

  const state = match[1];
  if (!IMPLEMENTATION_STATES.has(state)) {
    throw new Error(
      `Invalid Implementation State ${state}; expected NOT_STARTED, PARTIAL, COMPLETE, DEFERRED.`,
    );
  }

  return { state, source: 'Implementation State' };
}

function shouldEnforce(state) {
  return state === 'PARTIAL' || state === 'COMPLETE';
}

module.exports = { IMPLEMENTATION_STATES, parseImplementationState, shouldEnforce };
