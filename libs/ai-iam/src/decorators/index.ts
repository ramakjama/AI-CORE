// Decorators for NestJS/Express integration

// Store metadata in a simple Map since reflect-metadata may not be available
const metadataStore = new Map<string, Map<string, unknown>>();

function setMetadata(key: string, value: unknown, target: object, propertyKey: string): void {
  const targetKey = `${(target as { constructor: { name: string } }).constructor.name}:${propertyKey}`;
  if (!metadataStore.has(targetKey)) {
    metadataStore.set(targetKey, new Map());
  }
  metadataStore.get(targetKey)!.set(key, value);
}

export function getMetadata(key: string, target: object, propertyKey: string): unknown {
  const targetKey = `${(target as { constructor: { name: string } }).constructor.name}:${propertyKey}`;
  return metadataStore.get(targetKey)?.get(key);
}

export function Auth() {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const req = args[0] as { headers?: { authorization?: string } };
      const token = req?.headers?.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('Unauthorized');
      return original.apply(this, args);
    };
    return descriptor;
  };
}

export function Roles(...roles: string[]) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    setMetadata('roles', roles, target, propertyKey);
    return descriptor;
  };
}

export function Permissions(...permissions: string[]) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    setMetadata('permissions', permissions, target, propertyKey);
    return descriptor;
  };
}

export function CurrentUser() {
  return function (target: object, propertyKey: string, parameterIndex: number) {
    setMetadata('currentUser', parameterIndex, target, propertyKey);
  };
}

export function Tenant() {
  return function (target: object, propertyKey: string, parameterIndex: number) {
    setMetadata('tenant', parameterIndex, target, propertyKey);
  };
}
