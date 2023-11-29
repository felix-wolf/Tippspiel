import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";

export const rendererConfig: Configuration = {
	module: {
		rules,
	},
	target: "web",
	plugins,
	resolve: {
		extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".scss"],
	},
};
