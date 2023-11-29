import type { ModuleOptions } from "webpack";

export const rules: Required<ModuleOptions>["rules"] = [
	// Add support for native node modules
	{
		// We're specifying native_modules in the test because the asset relocator loader generates a
		// "fake" .node file which is really a cjs file.
		test: /native_modules[/\\].+\.node$/,
		use: "node-loader",
	},
	{
		test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
		parser: { amd: false },
		use: {
			loader: "@vercel/webpack-asset-relocator-loader",
			options: {
				outputAssetBase: "native_modules",
			},
		},
	},
	{
		test: /\.tsx?$/,
		exclude: /(node_modules|\.webpack)/,
		use: {
			loader: "ts-loader",
			options: {
				transpileOnly: true,
			},
		},
	},
	{
		test: /\.s?css$/,
		use: [
			"style-loader",
			{
				loader: "css-loader",
				options: {
					importLoaders: 1,
					modules: {
						localIdentName: "[name]_[local]_[hash:base64:5]",
					},
				},
			},
			{
				loader: "sass-loader",
			},
		],
		include: /\.module\.s?css$/,
	},
	{
		test: /\.s?css$/,
		use: ["style-loader", "css-loader", "sass-loader"],
		exclude: /\.module\.s?css$/,
	},
	{
		test: /\.svg/,
		use: {
			loader: "svg-url-loader",
		},
	},
	{
		test: /\.(mov|mp4|mp3|ogg|m4a)$/,
		use: [
			{
				loader: "file-loader",
				options: {
					name: "[name].[ext]",
				},
			},
		],
	},
	{
		test: /\.(png|jpg|gif|sql)$/i,
		use: [
			{
				loader: "url-loader",
				options: {
					limit: 16384,
				},
			},
		],
	},
];
