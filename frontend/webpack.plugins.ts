import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import { DefinePlugin } from "webpack";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

export const plugins = [
	new ForkTsCheckerWebpackPlugin({
		logger: "webpack-infrastructure",
		typescript: {
			configFile: "../../tsconfig.json",
		},
	}),
	new DefinePlugin({
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		DEVELOPMENT: JSON.stringify(process.argv.includes("--DEV")),
	}),
];
