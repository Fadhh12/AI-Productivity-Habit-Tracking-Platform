import { extractJson } from './json-extract.util';

describe('extractJson', () => {
  it('parses plain JSON', () => {
    expect(extractJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips markdown fences', () => {
    expect(extractJson<{ a: number }>('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('finds JSON surrounded by prose', () => {
    expect(extractJson<{ a: number }>('Tentu! Ini hasilnya: {"a": 2} semoga membantu.')).toEqual({ a: 2 });
  });

  it('throws when there is no JSON', () => {
    expect(() => extractJson('maaf, tidak bisa')).toThrow('did not contain JSON');
  });
});
