import {
  CLIException,
  ERR_BAD_INPUT,
  Exception,
  serializeError,
} from '../errors';

import { stringify } from './json';

export interface Targets {
  readonly devices: readonly Target[];
  readonly virtualDevices: readonly Target[];
  readonly errors: readonly Exception<string>[];
}

export interface Target {
  readonly platform: 'android' | 'ios';
  readonly model?: string;
  readonly name?: string;
  readonly sdkVersion: string;
  readonly id: string;
  readonly format: () => string;
}

export function formatTargets(
  args: readonly string[],
  targets: Targets,
): string {
  const { devices, virtualDevices, errors } = targets;

  const virtualOnly = args.includes('--virtual');
  const devicesOnly = args.includes('--device');

  if (virtualOnly && devicesOnly) {
    throw new CLIException(
      'Only one of --device or --virtual may be specified',
      ERR_BAD_INPUT,
    );
  }

  if (args.includes('--json')) {
    let result;
    if (virtualOnly) {
      result = { virtualDevices, errors };
    } else if (devicesOnly) {
      result = { devices, errors };
    } else {
      result = { devices, virtualDevices, errors };
    }
    return stringify(result);
  }

  let output = '';

  if (errors.length > 0) {
    output += `Errors (!):\n\n${errors.map(e => `  ${serializeError(e)}`)}\n`;
  }

  if (!virtualOnly) {
    output += printTargets('Connected Device', devices);
    if (devicesOnly) {
      return output;
    }
    output += '\n';
  }
  output += printTargets('Virtual Device', virtualDevices);
  return output;
}

function printTargets(name: string, targets: readonly Target[]) {
  let output = `${name}s:\n\n`;
  if (targets.length === 0) {
    output += `  No ${name.toLowerCase()}s found\n`;
  } else {
    for (const target of targets) {
      output += `  ${target.format()}\n`;
    }
  }
  return output;
}
