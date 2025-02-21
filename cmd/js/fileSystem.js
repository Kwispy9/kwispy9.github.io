export class FileSystem {
  constructor() {
    this.currentPath = 'C:';
    this.structure = {
      'C:': {
        'Windows': {
          'System32': {},
          'Program Files': {}
        },
        'Users': {
          'Default': {
            'Documents': {},
            'Downloads': {},
            'Desktop': {}
          }
        }
      }
    };
    this.fileContents = new Map();
  }

  getCurrentPath() {
    return this.currentPath;
  }

  changeDirectory(path) {
    if (path === '..') {
      const parts = this.currentPath.split('\\');
      if (parts.length > 1) {
        parts.pop();
        this.currentPath = parts.join('\\');
      }
      return;
    }

    if (path === '\\' || path === '/') {
      this.currentPath = 'C:';
      return;
    }

    const newPath = path.startsWith('C:') ? path : `${this.currentPath}\\${path}`;
    let current = this.structure;
    const parts = newPath.split('\\');

    for (const part of parts) {
      if (part === 'C:') continue;
      if (!current[part]) {
        throw new Error(`The system cannot find the path specified: ${newPath}`);
      }
      current = current[part];
    }

    this.currentPath = newPath;
  }

  listDirectory() {
    let current = this.structure;
    const parts = this.currentPath.split('\\');

    for (const part of parts) {
      if (part === 'C:') continue;
      current = current[part];
    }

    const entries = Object.keys(current);
    if (entries.length === 0) return 'Directory is empty.';

    return entries.map(entry => {
      const isDirectory = current[entry] !== 'FILE';
      return `${isDirectory ? '<DIR>' : '<FILE>'} ${entry}`;
    }).join('\n');
  }

  makeDirectory(name) {
    let current = this.structure;
    const parts = this.currentPath.split('\\');

    for (const part of parts) {
      if (part === 'C:') continue;
      current = current[part];
    }

    if (current[name]) {
      throw new Error('A subdirectory or file already exists.');
    }

    current[name] = {};
  }

  removeDirectory(name) {
    let current = this.structure;
    const parts = this.currentPath.split('\\');

    for (const part of parts) {
      if (part === 'C:') continue;
      current = current[part];
    }

    if (!current[name]) {
      throw new Error('The system cannot find the directory specified.');
    }

    delete current[name];
  }

  createFile(name, content = '') {
    let current = this.structure;
    const parts = this.currentPath.split('\\');

    for (const part of parts) {
      if (part === 'C:') continue;
      current = current[part];
    }

    if (current[name]) {
      throw new Error('A file or directory with that name already exists.');
    }

    current[name] = 'FILE';
    const fullPath = `${this.currentPath}\\${name}`;
    this.fileContents.set(fullPath, content);
  }

  writeFile(name, content) {
    let current = this.structure;
    const parts = this.currentPath.split('\\');

    for (const part of parts) {
      if (part === 'C:') continue;
      current = current[part];
    }

    if (!current[name] || current[name] !== 'FILE') {
      throw new Error('File not found.');
    }

    const fullPath = `${this.currentPath}\\${name}`;
    this.fileContents.set(fullPath, content);
  }

  readFile(name) {
    const fullPath = name.startsWith('C:') ? name : `${this.currentPath}\\${name}`;
    const parts = fullPath.split('\\');
    const fileName = parts.pop();
    let current = this.structure;

    for (const part of parts) {
      if (part === 'C:') continue;
      if (!current[part]) {
        throw new Error(`The system cannot find the path specified: ${fullPath}`);
      }
      current = current[part];
    }

    if (!current[fileName] || current[fileName] !== 'FILE') {
      throw new Error(`File not found: ${fullPath}`);
    }

    const content = this.fileContents.get(fullPath);
    if (content === undefined) {
      throw new Error(`File content not found: ${fullPath}`);
    }

    return content;
  }

  deleteFile(name) {
    let current = this.structure;
    const parts = this.currentPath.split('\\');

    for (const part of parts) {
      if (part === 'C:') continue;
      current = current[part];
    }

    if (!current[name] || current[name] !== 'FILE') {
      throw new Error('File not found.');
    }

    const fullPath = `${this.currentPath}\\${name}`;
    this.fileContents.delete(fullPath);
    delete current[name];
  }

  moveItem(source, destination) {
    const sourcePath = source.startsWith('C:') ? source : `${this.currentPath}\\${source}`;
    const destPath = destination.startsWith('C:') ? destination : `${this.currentPath}\\${destination}`;
    
    const sourceParts = sourcePath.split('\\');
    const sourceItemName = sourceParts.pop();
    let sourceDir = this.structure;
    for (const part of sourceParts) {
      if (part === 'C:') continue;
      if (!sourceDir[part]) {
        throw new Error(`The system cannot find the path: ${sourcePath}`);
      }
      sourceDir = sourceDir[part];
    }

    if (!sourceDir[sourceItemName]) {
      throw new Error(`The system cannot find the file or directory: ${sourcePath}`);
    }

    const destParts = destPath.split('\\');
    let destDir = this.structure;
    for (const part of destParts) {
      if (part === 'C:') continue;
      if (!destDir[part]) {
        throw new Error(`The system cannot find the path: ${destPath}`);
      }
      destDir = destDir[part];
    }

    const isFile = sourceDir[sourceItemName] === 'FILE';
    
    if (isFile) {
      const sourceFullPath = `${sourceParts.join('\\')}\\${sourceItemName}`;
      const destFullPath = `${destPath}\\${sourceItemName}`;
      const content = this.fileContents.get(sourceFullPath);
      
      destDir[sourceItemName] = 'FILE';
      this.fileContents.set(destFullPath, content);
      this.fileContents.delete(sourceFullPath);
    } else {
      destDir[sourceItemName] = sourceDir[sourceItemName];
    }

    delete sourceDir[sourceItemName];
  }

  fileExists(path) {
    const fullPath = path.startsWith('C:') ? path : `${this.currentPath}\\${path}`;
    const parts = fullPath.split('\\');
    const fileName = parts.pop();
    let current = this.structure;

    for (const part of parts) {
      if (part === 'C:') continue;
      if (!current[part]) return false;
      current = current[part];
    }

    return current[fileName] === 'FILE' && this.fileContents.has(fullPath);
  }

  getFullPath(path) {
    return path.startsWith('C:') ? path : `${this.currentPath}\\${path}`;
  }
}