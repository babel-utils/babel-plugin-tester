export {};

expect(() => {
  throw new Error('not a throw expression');
}).toThrow('not a throw expression');

expect.pass('passed!' as string);
