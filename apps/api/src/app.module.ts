import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { validateEnv } from "./config/env";
import { PrismaModule } from "./prisma/prisma.module";
import { CryptoModule } from "./common/crypto/crypto.module";
import { AuthModule } from "./auth/auth.module";
import { AuditModule } from "./audit/audit.module";
import { HealthModule } from "./health/health.module";
import { TenancyModule } from "./tenancy/tenancy.module";
import { InstagramModule } from "./instagram/instagram.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { MessagingModule } from "./messaging/messaging.module";
import { InboxModule } from "./inbox/inbox.module";
import { FlowsModule } from "./flows/flows.module";
import { ContactsModule } from "./contacts/contacts.module";
import { SegmentsModule } from "./segments/segments.module";
import { BroadcastsModule } from "./broadcasts/broadcasts.module";
import { BillingModule } from "./billing/billing.module";
import { MetricsModule } from "./metrics/metrics.module";
import { AutomationsModule } from "./automations/automations.module";
import { UserModule } from "./user/user.module";
import { GdprModule } from "./gdpr/gdpr.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, envFilePath: ".env" }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        transport:
          process.env.NODE_ENV === "production"
            ? undefined
            : { target: "pino-pretty", options: { singleLine: true } },
        redact: ["req.headers.authorization", "req.headers.cookie"],
        autoLogging: { ignore: (req) => req.url === "/health" },
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: 60_000,
            limit: 60,
          },
        ],
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>("REDIS_URL") },
        defaultJobOptions: {
          removeOnComplete: { age: 24 * 3600, count: 5000 },
          removeOnFail: { age: 7 * 24 * 3600 },
          attempts: 3,
          backoff: { type: "exponential", delay: 10_000 },
        },
      }),
    }),
    PrismaModule,
    CryptoModule,
    AuthModule,
    AuditModule,
    HealthModule,
    TenancyModule,
    InstagramModule,
    WebhooksModule,
    MessagingModule,
    InboxModule,
    FlowsModule,
    ContactsModule,
    SegmentsModule,
    BroadcastsModule,
    BillingModule,
    AutomationsModule,
    UserModule,
    GdprModule,
    MetricsModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
