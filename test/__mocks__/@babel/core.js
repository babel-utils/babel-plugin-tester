// ? babel@<=7 are published in a weird way that's hostile to modification. The below allows us to spy on babel APIs. Without this, strange errors occur when Jest tries to mutate babel's weirdo module export.

module.exports = { ...require('@babel/core') };
