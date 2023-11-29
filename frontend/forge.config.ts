import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const config: ForgeConfig = {
	packagerConfig: {},
	rebuildConfig: {},
	makers: [new MakerSquirrel({}), new MakerZIP({}, ["darwin"]), new MakerRpm({}), new MakerDeb({})],
	plugins: [
		new WebpackPlugin({
			mainConfig,
			devContentSecurityPolicy:
				"default-src 'self' 'unsafe-inline' data: blob: speech:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:",
			renderer: {
				config: { ...rendererConfig },
				entryPoints: [
					{
						js: "./src/index.tsx",
						html: "./src/index.html",
						name: "app",
						preload: {
							js: "./src/preload.ts",
						},
					},
				],
			},
		}),
	],
};

export default config;
