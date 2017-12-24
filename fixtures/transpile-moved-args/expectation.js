

function wrappedWarn() {
  var _console, _console2;

  (_console = console).warn.apply(_console, arguments);
  (true && (_console2 = console).warn.apply(_console2, arguments));
}