import { Controller, HttpCode, Module, Post, Req } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { Request } from "express";
import * as http from "http";
import { applyBodyParser } from "../common/body-parser";

@Controller("webhooks")
class EchoController {
  @Post("instagram")
  @HttpCode(200)
  receive(@Req() req: RawBodyRequest<Request>) {
    return {
      hasRawBody: Boolean(req.rawBody?.length),
      bodyParsed: typeof req.body === "object" && req.body !== null,
    };
  }
}

@Module({ controllers: [EchoController] })
class EchoModule {}

function post(port: number, payload: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        port,
        path: "/webhooks/instagram",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, body: buf ? JSON.parse(buf) : null }),
        );
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

describe("body parser wiring (main.ts)", () => {
  let app: NestExpressApplication;

  afterEach(async () => {
    if (app) await app.close();
  });

  it("preserves req.rawBody for webhook signature verification with the 1mb json limit applied", async () => {
    app = await NestFactory.create<NestExpressApplication>(EchoModule, {
      rawBody: true,
      logger: false,
    });
    applyBodyParser(app);
    await app.listen(0);
    const port = (app.getHttpServer().address() as { port: number }).port;

    const res = await post(port, JSON.stringify({ entry: [{ id: "1" }] }));

    expect(res.status).toBe(200);
    expect(res.body.bodyParsed).toBe(true);
    // Regression: app.use(json()) before Nest's parser consumed the stream and
    // left req.rawBody undefined, so every Meta webhook failed signature checks.
    expect(res.body.hasRawBody).toBe(true);
  });

  it("still accepts bodies larger than the 100kb express default", async () => {
    app = await NestFactory.create<NestExpressApplication>(EchoModule, {
      rawBody: true,
      logger: false,
    });
    applyBodyParser(app);
    await app.listen(0);
    const port = (app.getHttpServer().address() as { port: number }).port;

    const big = JSON.stringify({ pad: "x".repeat(200 * 1024) });
    const res = await post(port, big);
    expect(res.status).toBe(200);
    expect(res.body.hasRawBody).toBe(true);
  });
});
