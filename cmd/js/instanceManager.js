export class InstanceManager {
  constructor() {
    this.storageKey = 'cmd_instances';
  }

  // Save current instance
  saveInstance(name, password, fileSystem) {
    const instances = this.getInstances();
    
    // Check if instance with this name already exists
    if (instances[name]) {
      throw new Error('An instance with this name already exists.');
    }

    // Create encrypted instance data
    const instanceData = {
      password: this.hashPassword(password),
      data: this.encryptData(JSON.stringify({
        currentPath: fileSystem.getCurrentPath(),
        structure: fileSystem.structure,
        fileContents: Array.from(fileSystem.fileContents.entries())
      }), password)
    };

    // Save to localStorage
    instances[name] = instanceData;
    localStorage.setItem(this.storageKey, JSON.stringify(instances));
    
    return 'Instance saved successfully.';
  }

  // Load instance
  loadInstance(name, password, fileSystem) {
    const instances = this.getInstances();
    const instance = instances[name];

    if (!instance) {
      throw new Error('Instance not found.');
    }

    // Verify password
    if (instance.password !== this.hashPassword(password)) {
      throw new Error('Incorrect password.');
    }

    try {
      // Decrypt and parse instance data
      const decryptedData = JSON.parse(this.decryptData(instance.data, password));
      
      // Update file system
      fileSystem.currentPath = decryptedData.currentPath;
      fileSystem.structure = decryptedData.structure;
      fileSystem.fileContents = new Map(decryptedData.fileContents);

      return 'Instance loaded successfully.';
    } catch (error) {
      throw new Error('Failed to load instance: ' + error.message);
    }
  }

  // List all saved instances
  listInstances() {
    const instances = this.getInstances();
    return Object.keys(instances);
  }

  // Get all instances from localStorage
  getInstances() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : {};
  }

  // Simple password hashing
  hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  // Simple encryption/decryption
  encryptData(data, key) {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result);
  }

  decryptData(encryptedData, key) {
    const data = atob(encryptedData);
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  }
}