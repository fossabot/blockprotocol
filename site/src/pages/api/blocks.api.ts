import type { NextApiHandler } from "next/";

/** @sync @hashintel/block-protocol */
export type BlockProps = object;

/** @sync @hashintel/block-protocol */
export type BlockVariant = {
  description?: string;
  displayName?: string;
  icon?: string;
  properties?: BlockProps;
};

// move to types.ts
/** @sync @hashintel/block-protocol */
export type BlockMetadata = {
  author?: string;
  description?: string;
  displayName?: string;
  externals?: Record<string, string>;
  icon?: string;
  license?: string;
  name?: string;
  schema?: string;
  source?: string;
  variants?: BlockVariant[];
  version?: string;
  lastUpdated?: string;

  // @todo should be redundant to block's package.json#name
  packagePath: string;
};

export type BlockRegistryInfo = {
  workspace: string;
  repository: string;
  branch: string;
  distDir: string;
  timestamp: string;
};

/**
 * used to read block metadata from disk.
 *
 * @todo nextjs api endpoints don't have access to nextjs' public folder on vercel
 */
export const readBlocksFromDisk = (): BlockMetadata[] => {
  /* eslint-disable global-require -- dependencies are required at runtime to avoid bundling them w/ nextjs */
  const fs = require("fs");
  const glob = require("glob");
  /* eslint-enable global-require */

  const registryInfo: BlockRegistryInfo[] = glob
    .sync(`${process.cwd()}/../registry/**/*.json`)
    .map((path: string) => ({
      ...JSON.parse(fs.readFileSync(path, { encoding: "utf8" })),
    }));

  return glob
    .sync(`${process.cwd()}/public/blocks/**/metadata.json`)
    .map((path: string) => ({
      // @todo should be redundant to block's package.json#name
      packagePath: path.split("/").slice(-3, -1).join("/"),
      ...JSON.parse(fs.readFileSync(path, { encoding: "utf8" })),
    }))
    .map((metadata: BlockMetadata) => ({
      ...metadata,
      lastUpdated: registryInfo.find(
        ({ workspace }) => workspace === metadata.name,
      )?.timestamp,
    }));
};

let cachedBlocksFromDisk: Array<BlockMetadata> | null = null;

const blocks: NextApiHandler<BlockMetadata[]> = (_req, res) => {
  cachedBlocksFromDisk ??= readBlocksFromDisk();
  res.status(200).json(cachedBlocksFromDisk);
};

export default blocks;
