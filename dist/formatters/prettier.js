"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _prettier = _interopRequireDefault(require("prettier"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const configByDir = {};

function getConfig(dir) {
  if (!configByDir.hasOwnProperty(dir)) {
    configByDir[dir] = _prettier.default.resolveConfig.sync(dir);
  }

  return configByDir[dir];
}

function prettierFormatter(code, {
  cwd = process.cwd(),
  filename = _path.default.join(cwd, 'macro-test.js'),
  config = getConfig(cwd)
} = {}) {
  return _prettier.default.format(code, {
    filepath: filename,
    ...config
  });
}

var _default = prettierFormatter;
exports.default = _default;