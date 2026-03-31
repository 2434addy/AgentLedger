import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function MaxJsonSize(maxBytes: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxJsonSize',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} must not exceed ${maxBytes} bytes when serialized`,
        ...validationOptions,
      },
      constraints: [maxBytes],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (value === null || value === undefined) return true;
          const maxSize = args.constraints[0] as number;
          try {
            const serialized = JSON.stringify(value);
            return Buffer.byteLength(serialized, 'utf8') <= maxSize;
          } catch {
            return false;
          }
        },
      },
    });
  };
}
