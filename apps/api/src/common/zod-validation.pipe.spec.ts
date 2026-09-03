import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
  it("rejects unknown top-level properties instead of silently stripping them", () => {
    const pipe = new ZodValidationPipe(z.object({ name: z.string() }));

    expect(() => pipe.transform({ name: "Ada", admin: true })).toThrow(BadRequestException);
  });

  it("returns validated values", () => {
    const pipe = new ZodValidationPipe(z.object({ name: z.string().trim() }));
    expect(pipe.transform({ name: " Ada " })).toEqual({ name: "Ada" });
  });
});
