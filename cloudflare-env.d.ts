declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    ZHIHU_ACCESS_SECRET?: string;
    ZHIHU_MODEL?: string;
    AI_DAILY_LIMIT?: string;
    BUCKET?: R2Bucket;
  }
}
