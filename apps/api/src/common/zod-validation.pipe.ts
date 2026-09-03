import { BadRequestException, PipeTransform } from "@nestjs/common";
import { z, ZodSchema } from "zod";

/** Boundary validation: use as @Body(new ZodValidationPipe(schema)). */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    // Zod objects strip unknown keys by default. API boundaries must fail closed so
    // client typos and attempted mass-assignment never pass silently.
    const boundarySchema = (this.schema instanceof z.ZodObject ? this.schema.strict() : this.schema) as ZodSchema<T>;
    const result = boundarySchema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        title: "Validation failed",
        code: "VALIDATION_FAILED",
        detail: "One or more request fields are invalid",
        errors: result.error.issues.reduce<Record<string, string[]>>((errors, issue) => {
          const path = issue.path.join(".") || "body";
          (errors[path] ??= []).push(issue.message);
          return errors;
        }, {}),
      });
    }
    return result.data;
  }
}
