import fs from 'fs';
import path from 'path';
import type { NextConfig } from 'next';

function getInsforgeProjectId(): string | null {
  try {
    let dir = __dirname;
    while (dir !== path.dirname(dir)) {
      const filePath = path.join(dir, '.insforge', 'project.json');
      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return content.project_id ?? null;
      }
      dir = path.dirname(dir);
    }
    return null;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_INSFORGE_PROJECT_ID: getInsforgeProjectId() ?? '',
  },
};

export default nextConfig;
