import { backendBasePath, backendPort } from "./local-config";

export const backendPath = `${window.location.protocol}//${window.location.hostname}:${backendPort}${backendBasePath}`;