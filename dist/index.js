"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
Object.defineProperty(exports, "prettierFormatter", {
  enumerable: true,
  get: function () {
    return _prettier.default;
  }
});
Object.defineProperty(exports, "runPluginUnderTestHere", {
  enumerable: true,
  get: function () {
    return _pluginTester.runPluginUnderTestHere;
  }
});
Object.defineProperty(exports, "unstringSnapshotSerializer", {
  enumerable: true,
  get: function () {
    return _unstringSnapshotSerializer.default;
  }
});

var _pluginTester = _interopRequireWildcard(require("./plugin-tester"));

var _prettier = _interopRequireDefault(require("./formatters/prettier"));

var _unstringSnapshotSerializer = _interopRequireDefault(require("./unstring-snapshot-serializer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// istanbul ignore else (it's not worth testing)
if (typeof expect !== 'undefined' && expect.addSnapshotSerializer) {
  expect.addSnapshotSerializer(_unstringSnapshotSerializer.default);
}

function defaultPluginTester(options) {
  return (0, _pluginTester.default)({
    formatResult: _prettier.default,
    ...options
  });
}

var _default = defaultPluginTester;
exports.default = _default;