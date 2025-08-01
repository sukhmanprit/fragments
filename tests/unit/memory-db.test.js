//src/tests/unit/memory-db.test.js

// Fix this path to point to your project's `memory-db.js` source file
const MemoryDB = require('../../src/model/data/memory/memory-db');

const {
    writeFragment,
    readFragment,
    writeFragmentData,
    readFragmentData,
  } = require('../../src/model/data/memory/index');

describe('memory-db', () => {
  let db;

  // Each test will get its own, empty database instance
  beforeEach(() => {
    db = new MemoryDB();
  });

  test('put() returns nothing', async () => {
    const result = await db.put('a', 'b', {});
    expect(result).toBe(undefined);
  });

  test('get() returns what we put() into the db', async () => {
    const data = { value: 123 };
    await db.put('a', 'b', data);
    const result = await db.get('a', 'b');
    expect(result).toEqual(data);
  });

  test('put() and get() work with Buffers', async () => {
    const data = Buffer.from([1, 2, 3]);
    await db.put('a', 'b', data);
    const result = await db.get('a', 'b');
    expect(result).toEqual(data);
  });

  test('get() with incorrect secondaryKey returns nothing', async () => {
    await db.put('a', 'b', 123);
    const result = await db.get('a', 'c');
    expect(result).toBe(undefined);
  });

  test('query() returns all secondaryKey values', async () => {
    await db.put('a', 'a', { value: 1 });
    await db.put('a', 'b', { value: 2 });
    await db.put('a', 'c', { value: 3 });

    const results = await db.query('a');
    expect(Array.isArray(results)).toBe(true);
    expect(results).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }]);
  });
  
  test('query() returns empty array', async () => {
    await db.put('b', 'a', { value: 1 });
    await db.put('b', 'b', { value: 2 });
    await db.put('b', 'c', { value: 3 });

    const results = await db.query('a');
    expect(Array.isArray(results)).toBe(true);
    expect(results).toEqual([]);
  });

  test('del() removes value put() into db', async () => {
    await db.put('a', 'a', { value: 1 });
    expect(await db.get('a', 'a')).toEqual({ value: 1 });
    await db.del('a', 'a');
    expect(await db.get('a', 'a')).toBe(undefined);
  });

  test('del() throws if primaryKey and secondaryKey not in db', () => {
    expect(() => db.del('a', 'a')).rejects.toThrow();
  });

  test('get() expects string keys', () => {
    expect(async () => await db.get()).rejects.toThrow();
    expect(async () => await db.get(1)).rejects.toThrow();
    expect(async () => await db.get(1, 1)).rejects.toThrow();
  });

  test('put() expects string keys', () => {
    expect(async () => await db.put()).rejects.toThrow();
    expect(async () => await db.put(1)).rejects.toThrow();
    expect(async () => await db.put(1, 1)).rejects.toThrow();
  });

  test('query() expects string key', () => {
    expect(async () => await db.query()).rejects.toThrow();
    expect(async () => await db.query(1)).rejects.toThrow();
  });

  test('del() expects string keys', () => {
    expect(async () => await db.del()).rejects.toThrow();
    expect(async () => await db.del(1)).rejects.toThrow();
    expect(async () => await db.del(1, 1)).rejects.toThrow();
  });

  // Added tests for readFragment, writeFragment, readFragmentData, and writeFragmentData

  const mockFragment = { ownerId: 'user1', id: 'frag1', content: 'fragment test' };
  const mockBuffer = Buffer.from('this is meta data');

  test('writeFragment() writes metadata and readFragment() reads it back', async () => {
    // Write the fragment
    const writeResult = await writeFragment(mockFragment);
    expect(writeResult).toBeUndefined(); 
    
    // Read the fragment and verify the result
    const readResult = await readFragment(mockFragment.ownerId, mockFragment.id);
    expect(readResult).toEqual(mockFragment); 
  });

  // Verifies that a non-existent fragment returns undefined
  test('readFragment() returns undefined for nonexistent fragment', async () => {
    const result = await readFragment('user1', 'nonexistentFrag');
    expect(result).toBeUndefined(); 
  });

  test('writeFragmentData() writes buffer and readFragmentData() reads it back', async () => {
    // Write the data buffer
    const writeResult = await writeFragmentData('user1', 'frag1', mockBuffer);
    expect(writeResult).toBeUndefined(); 
    
    // Read the buffer and verify the result
    const readResult = await readFragmentData('user1', 'frag1');
    expect(readResult).toEqual(mockBuffer); 
  });

  // Verifies that non-existent data returns undefined
  test('readFragmentData() returns undefined for nonexistent fragment data', async () => {
    const result = await readFragmentData('user1', 'nonexistentFrag');
    expect(result).toBeUndefined(); 
  });
});