import * as babel from '@babel/core';

// ? Doing things this way so we can spyOn babel APIs and without this we were
// ? getting errors: TypeError: Cannot set property transform of #<Object> which
// ? has only a getter
module.exports = { ...babel };
