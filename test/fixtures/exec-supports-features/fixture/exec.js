expect(require('path').dirname(__filename)).toBe(__dirname)
expect(JSON.stringify(require(`${__dirname}/imported-file.json`))).toStrictEqual(JSON.stringify({ data: 'imported' }));
