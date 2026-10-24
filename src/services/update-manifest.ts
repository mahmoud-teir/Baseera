import { z } from 'zod';

const updateSchema = z.object({
  latestVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  latestVersionCode: z.number().int().positive().max(2100000000),
  apkUrl: z.string().url().refine((url) => url.startsWith('https://'), 'APK URL must use HTTPS'),
  releaseNotes: z.string().default(''),
  isMandatory: z.boolean().default(false),
  releasedAt: z.string().optional(),
  fileSizeBytes: z.number().int().positive().optional(),
});

export type AppUpdateData = z.infer<typeof updateSchema>;

export function parseUpdateManifest(value: unknown): AppUpdateData {
  return updateSchema.parse(value);
}

// Android permits upgrades only when versionCode increases. All ABI outputs use the same code.
export function isInstallableUpdate(update: AppUpdateData, currentCode: number): boolean {
  return update.latestVersionCode > currentCode;
}
