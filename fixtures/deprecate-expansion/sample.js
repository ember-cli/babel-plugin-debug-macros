import { DEBUG } from '@ember/env-flags';
import { deprecate } from '@ember/debug-tools';

deprecate('This is deprecated', true);
deprecate('Message without predicate');
deprecate('This is deprecated with options', true, {
  id: 'woot.options',
  until: '3.0.0',
});
function wrappedDeprecate() {
  deprecate(
    'This is also deprecated', true, {
      "id": "woot.wrapped",
      "until": "7.0.0",
    }
  );
}