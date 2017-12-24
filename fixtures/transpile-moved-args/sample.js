import { warn } from '@ember/debug-tools';

function wrappedWarn() {
  console.warn(...arguments);
  warn(...arguments);
}
