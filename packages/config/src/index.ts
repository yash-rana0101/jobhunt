import { config as loadDotenv } from "dotenv";

loadDotenv();

export type RuntimeEnvironment = "development" | "test" | "production";

export type EnvironmentConfig = {
  NODE_ENV: RuntimeEnvironment;
  API_PORT: number;
  DATABASE_URL?: string;
  OPENAI_API_KEY?: string;
  TAVILY_API_KEY?: string;
  FIRECRAWL_API_KEY?: string;
  RESEND_API_KEY?: string;
  LINKEDIN_EMAIL?: string;
  LINKEDIN_PASSWORD?: string;
};

type EnvironmentInput = Record<string, string | undefined>;

const supportedEnvironments: readonly RuntimeEnvironment[] = ["development", "test", "production"];

function parseRuntimeEnvironment(value: string | undefined): RuntimeEnvironment {
  if (supportedEnvironments.includes(value as RuntimeEnvironment)) {
    return value as RuntimeEnvironment;
  }

  return "development";
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return 4000;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return 4000;
  }

  return parsed;
}

function optionalValue(value: string | undefined): string | undefined {
  return value && value.trim().length > 0 ? value : undefined;
}

export function loadConfig(environment: EnvironmentInput = process.env): EnvironmentConfig {
  return {
    NODE_ENV: parseRuntimeEnvironment(environment.NODE_ENV),
    API_PORT: parsePort(environment.API_PORT),
    DATABASE_URL: optionalValue(environment.DATABASE_URL),
    OPENAI_API_KEY: optionalValue(environment.OPENAI_API_KEY),
    TAVILY_API_KEY: optionalValue(environment.TAVILY_API_KEY),
    FIRECRAWL_API_KEY: optionalValue(environment.FIRECRAWL_API_KEY),
    RESEND_API_KEY: optionalValue(environment.RESEND_API_KEY),
    LINKEDIN_EMAIL: optionalValue(environment.LINKEDIN_EMAIL),
    LINKEDIN_PASSWORD: optionalValue(environment.LINKEDIN_PASSWORD),
  };
}
