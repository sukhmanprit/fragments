//src/model/fragment.js

// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId) {
        throw new Error("ownerId is required");
      }
      if(!type){
        throw new Error("type is required");
      }
      if (typeof size !== 'number' || size < 0) {
        throw new Error("size must be non-negative number");
      }
      if (!Fragment.isSupportedType(type)) {
        throw new Error(`Unsupported type: ${type}`);
      }
  
      this.id = id || randomUUID();
      this.ownerId = ownerId;
      this.type = type;
      this.size = size;
      this.created = created || new Date().toISOString();
      this.updated = updated || this.created;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    const fragments = await listFragments(ownerId, expand);
    return fragments;
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    const fragmentData = await readFragment(ownerId, id);
    if (!fragmentData) {
        throw new Error(`Fragment not found for id: ${id}`);
    }
    return new Fragment(fragmentData);
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    try {
      await deleteFragment(ownerId, id);
      // Deletion successful
    } catch (error) {
      throw new Error(`Failed to delete fragment with id: ${id}, error: ${error}`);
    }
  }



  /**
   * Saves the current fragment to the database
   * @returns Promise<void>
   */
  save() {
    this.updated = new Date().toISOString();
    return writeFragment(this)
        .then(() => {
      // Fragment saved successfully
        })
        .catch((error) => {
        throw new Error(`Failed to save fragment: ${error}`);
        });
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  async getData() {
    try {
      const data = await readFragmentData(this.ownerId, this.id);
      return data;
    } catch (error) {
      throw new Error(`Failed to get fragment data: ${error}`);
    }
  }


  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    if (!Buffer.isBuffer(data)) {
        throw new Error("Data must be a Buffer");
      }
      this.size = data.length;
      this.updated = new Date().toISOString();
      await writeFragmentData(this.ownerId, this.id, data);
      await this.save();
  }
  

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    return [this.mimeType];
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    const supportedTypes = ['text/plain','text/html','text/markdown','text/csv', 'application/json', 'application/yaml', 'image/png','image/jpeg', 'image/webp', 'image/avif', 'image/gif'];
    const { type } = contentType.parse(value);
    return supportedTypes.includes(type);
  }
}

module.exports.Fragment = Fragment;