import fs from 'fs';
import { contextBridge, ipcRenderer } from 'electron';
import path from 'path';

// --------- Expose some API to the Renderer process. ---------
contextBridge.exposeInMainWorld('fs', fs);
contextBridge.exposeInMainWorld('path', path);
contextBridge.exposeInMainWorld('exePath', process.execPath);
contextBridge.exposeInMainWorld('isAppx', process.windowsStore);
contextBridge.exposeInMainWorld('env', { ...process.env });
contextBridge.exposeInMainWorld('ipcRenderer', withPrototype(ipcRenderer));

// `exposeInMainWorld` can't detect attributes and methods of `prototype`, manually patching it.
function withPrototype(obj: Record<string, any>) {
  const protos = Object.getPrototypeOf(obj);

  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue;

    if (typeof value === 'function') {
      // Some native APIs, like `NodeJS.EventEmitter['on']`, don't work in the Renderer process. Wrapping them into a function.
      obj[key] = function (...args: any) {
        return value.call(obj, ...args);
      };
    }
    else {
      obj[key] = value;
    }
  }
  return obj;
}
